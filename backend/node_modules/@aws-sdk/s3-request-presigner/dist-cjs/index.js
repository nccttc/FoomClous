'use strict';

var utilFormatUrl = require('@aws-sdk/util-format-url');
var middlewareEndpoint = require('@smithy/middleware-endpoint');
var protocolHttp = require('@smithy/protocol-http');
var signatureV4MultiRegion = require('@aws-sdk/signature-v4-multi-region');

const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
const SHA256_HEADER = "X-Amz-Content-Sha256";

class S3RequestPresigner {
    signer;
    constructor(options) {
        const resolvedOptions = {
            service: options.signingName || options.service || "s3",
            uriEscapePath: options.uriEscapePath || false,
            applyChecksum: options.applyChecksum || false,
            ...options,
        };
        this.signer = new signatureV4MultiRegion.SignatureV4MultiRegion(resolvedOptions);
    }
    presign(requestToSign, { unsignableHeaders = new Set(), hoistableHeaders = new Set(), unhoistableHeaders = new Set(), ...options } = {}) {
        this.prepareRequest(requestToSign, {
            unsignableHeaders,
            unhoistableHeaders,
            hoistableHeaders,
        });
        return this.signer.presign(requestToSign, {
            expiresIn: 900,
            unsignableHeaders,
            unhoistableHeaders,
            ...options,
        });
    }
    presignWithCredentials(requestToSign, credentials, { unsignableHeaders = new Set(), hoistableHeaders = new Set(), unhoistableHeaders = new Set(), ...options } = {}) {
        this.prepareRequest(requestToSign, {
            unsignableHeaders,
            unhoistableHeaders,
            hoistableHeaders,
        });
        return this.signer.presignWithCredentials(requestToSign, credentials, {
            expiresIn: 900,
            unsignableHeaders,
            unhoistableHeaders,
            ...options,
        });
    }
    prepareRequest(requestToSign, { unsignableHeaders = new Set(), unhoistableHeaders = new Set(), hoistableHeaders = new Set(), } = {}) {
        unsignableHeaders.add("content-type");
        Object.keys(requestToSign.headers)
            .map((header) => header.toLowerCase())
            .filter((header) => header.startsWith("x-amz-server-side-encryption"))
            .forEach((header) => {
            if (!hoistableHeaders.has(header)) {
                unhoistableHeaders.add(header);
            }
        });
        requestToSign.headers[SHA256_HEADER] = UNSIGNED_PAYLOAD;
        const currentHostHeader = requestToSign.headers.host;
        const port = requestToSign.port;
        const expectedHostHeader = `${requestToSign.hostname}${requestToSign.port != null ? ":" + port : ""}`;
        if (!currentHostHeader || (currentHostHeader === requestToSign.hostname && requestToSign.port != null)) {
            requestToSign.headers.host = expectedHostHeader;
        }
    }
}

const getSignedUrl = async (client, command, options = {}) => {
    let s3Presigner;
    let region;
    if (typeof client.config.endpointProvider === "function") {
        const endpointV2 = await middlewareEndpoint.getEndpointFromInstructions(command.input, command.constructor, client.config);
        const authScheme = endpointV2.properties?.authSchemes?.[0];
        if (authScheme?.name === "sigv4a") {
            region = authScheme?.signingRegionSet?.join(",");
        }
        else {
            region = authScheme?.signingRegion;
        }
        s3Presigner = new S3RequestPresigner({
            ...client.config,
            signingName: authScheme?.signingName,
            region: async () => region,
        });
    }
    else {
        s3Presigner = new S3RequestPresigner(client.config);
    }
    const presignInterceptMiddleware = (next, context) => async (args) => {
        const { request } = args;
        if (!protocolHttp.HttpRequest.isInstance(request)) {
            throw new Error("Request to be presigned is not an valid HTTP request.");
        }
        delete request.headers["amz-sdk-invocation-id"];
        delete request.headers["amz-sdk-request"];
        delete request.headers["x-amz-user-agent"];
        let presigned;
        const presignerOptions = {
            ...options,
            signingRegion: options.signingRegion ?? context["signing_region"] ?? region,
            signingService: options.signingService ?? context["signing_service"],
        };
        if (context.s3ExpressIdentity) {
            presigned = await s3Presigner.presignWithCredentials(request, context.s3ExpressIdentity, presignerOptions);
        }
        else {
            presigned = await s3Presigner.presign(request, presignerOptions);
        }
        return {
            response: {},
            output: {
                $metadata: { httpStatusCode: 200 },
                presigned,
            },
        };
    };
    const middlewareName = "presignInterceptMiddleware";
    const clientStack = client.middlewareStack.clone();
    clientStack.addRelativeTo(presignInterceptMiddleware, {
        name: middlewareName,
        relation: "before",
        toMiddleware: "awsAuthMiddleware",
        override: true,
    });
    const handler = command.resolveMiddleware(clientStack, client.config, {});
    const { output } = await handler({ input: command.input });
    const { presigned } = output;
    return utilFormatUrl.formatUrl(presigned);
};

exports.S3RequestPresigner = S3RequestPresigner;
exports.getSignedUrl = getSignedUrl;
