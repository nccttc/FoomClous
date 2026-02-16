const crypto = require('crypto');

const AUTH_KEY_VALUE_RE = /(\w+)=["']?([^'"]{1,10000})["']?/;
let NC = 0;
const NC_PAD = '00000000';

function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function digestAuthHeader(method, uri, wwwAuthenticate, userpass) {
  const parts = wwwAuthenticate.split(',');
  const opts = {};
  for (let i = 0; i < parts.length; i++) {
    const m = AUTH_KEY_VALUE_RE.exec(parts[i]);
    if (m) {
      opts[m[1]] = m[2].replace(/["']/g, '');
    }
  }

  if (!opts.realm || !opts.nonce) {
    return '';
  }

  let qop = opts.qop || '';

  // WWW-Authenticate: Digest realm="testrealm@host.com",
  //                       qop="auth,auth-int",
  //                       nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",
  //                       opaque="5ccc069c403ebaf9f0171e9517f40e41"
  // Authorization: Digest username="Mufasa",
  //                    realm="testrealm@host.com",
  //                    nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",
  //                    uri="/dir/index.html",
  //                    qop=auth,
  //                    nc=00000001,
  //                    cnonce="0a4f113b",
  //                    response="6629fae49393a05397450978507c4ef1",
  //                    opaque="5ccc069c403ebaf9f0171e9517f40e41"
  // HA1 = MD5( "Mufasa:testrealm@host.com:Circle Of Life" )
  //      = 939e7578ed9e3c518a452acee763bce9
  //
  //  HA2 = MD5( "GET:/dir/index.html" )
  //      = 39aff3a2bab6126f332b942af96d3366
  //
  //  Response = MD5( "939e7578ed9e3c518a452acee763bce9:\
  //                   dcd98b7102dd2f0e8b11d0f600bfb0c093:\
  //                   00000001:0a4f113b:auth:\
  //                   39aff3a2bab6126f332b942af96d3366" )
  //           = 6629fae49393a05397450978507c4ef1
  userpass = userpass.split(':');

  let nc = String(++NC);
  nc = NC_PAD.substring(nc.length) + nc;
  const cnonce = crypto.randomBytes(8).toString('hex');

  const ha1 = md5(userpass[0] + ':' + opts.realm + ':' + userpass[1]);
  const ha2 = md5(method.toUpperCase() + ':' + uri);
  let s = ha1 + ':' + opts.nonce;
  if (qop) {
    qop = qop.split(',')[0];
    s += ':' + nc + ':' + cnonce + ':' + qop;
  }
  s += ':' + ha2;
  const response = md5(s);
  let authstring = 'Digest username="' + userpass[0] + '", realm="' + opts.realm
    + '", nonce="' + opts.nonce + '", uri="' + uri
    + '", response="' + response + '"';
  if (opts.opaque) {
    authstring += ', opaque="' + opts.opaque + '"';
  }
  if (qop) {
    authstring +=', qop=' + qop + ', nc=' + nc + ', cnonce="' + cnonce + '"';
  }
  return authstring;
}

module.exports = digestAuthHeader;
