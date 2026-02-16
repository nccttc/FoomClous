import { getThrow200ExceptionsPlugin } from "@aws-sdk/middleware-sdk-s3";
import { getSsecPlugin } from "@aws-sdk/middleware-ssec";
import { getEndpointPlugin } from "@smithy/middleware-endpoint";
import { Command as $Command } from "@smithy/smithy-client";
import { commonParams } from "../endpoint/EndpointParameters";
import { SelectObjectContent$ } from "../schemas/schemas_0";
export { $Command };
export class SelectObjectContentCommand extends $Command
    .classBuilder()
    .ep({
    ...commonParams,
    Bucket: { type: "contextParams", name: "Bucket" },
})
    .m(function (Command, cs, config, o) {
    return [
        getEndpointPlugin(config, Command.getEndpointParameterInstructions()),
        getThrow200ExceptionsPlugin(config),
        getSsecPlugin(config),
    ];
})
    .s("AmazonS3", "SelectObjectContent", {
    eventStream: {
        output: true,
    },
})
    .n("S3Client", "SelectObjectContentCommand")
    .sc(SelectObjectContent$)
    .build() {
}
