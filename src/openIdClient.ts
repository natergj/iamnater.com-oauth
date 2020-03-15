import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";

interface JWK {
  kid: string;
  e: string;
  kty: string;
  alg: string;
  n: string;
  use: string;
}

interface TokenData {
  iss: string;
  sub: string;
  email: string;
  name: string;
  exp: number;
}

export enum OpenIdProvider {
  AWS = "aws",
}

const providerConfig = {
  jwks_uri: "https://cognito-identity.amazonaws.com/.well-known/jwks_uri",
  // token_endpoint: "https://auth.iamnater.com/oauth2/token",
  // token_endpoint: "https://cognito-identity.amazonaws.com/oauth2/token",
  token_endpoint: "https://iamnater.auth.us-east-2.amazoncognito.com/oauth2/token",
}

const providerJwks = [
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"ap-northeast-11","n":"AI7mc1assO5n6yB4b7jPCFgVLYPSnwt4qp2BhJVAmlXRntRZ5w4910oKNZDOr4fe/BWOI2Z7upUTE/ICXdqirEkjiPbBN/duVy5YcHsQ5+GrxQ/UbytNVN/NsFhdG8W31lsE4dnrGds5cSshLaohyU/aChgaIMbmtU0NSWQ+jwrW8q1PTvnThVQbpte59a0dAwLeOCfrx6kVvs0Y7fX7NXBbFxe8yL+JR3SMJvxBFuYC+/om5EIRIlRexjWpNu7gJnaFFwbxCBNwFHahcg5gdtSkCHJy8Gj78rsgrkEbgoHk29pk8jUzo/O/GuSDGw8qXb6w0R1+UsXPYACOXM8C8+E=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"ap-northeast-21","n":"AIHzdsSdHLX/a2jBt9GjpX1cvnWmeKhKgA3Pa2d5lTWMuQlWqP8yRnMDvH4j8yrzkf3uTSUVtfHYUDwYvXTjQMKyw1DYprrCo6g0aKThVmCvgfGCL2nWSiAcql6qnAUMhvvyTLZkPCLGgJnqUxuwkxYzs+hoXrNx2WKUyNOVIGXEVCxJBXJaWe4ERrk9iiu022UPmZuQwsHvf010eH7tHhw03MZJ9lTVpC+A+rSgGuWUo8Nb3d8OcBf3ObjL4gQ9EeclhXSt7TUnXR0NxHnErGiDAE6FGePRbAFoAJWoSsM4FoqixGr6E0uTsA5IfJ+VnveYCTpqsuxYy/lupZNxwRE=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"ap-south-11","n":"AIgVHiyTeMG5uNWFBR5lombNayt53U0nWpBFWTUsv2Wey9O2hsUVnAZGlcziy6g9X7E/EDS+itQ084tIeFs7hfvDgJd/GiT4nxt34wTxu59c4Lw8XmrDQD6YaPu0BocWoWN/ukh6yBjJSG3iUv2fVNaG+HeYr0dRmw1hmUhX3RQkjmgJMh6UZetjsw11VgxOeVqS9vTbyVZQhIFMEYZh9upyLFVSwsb6PaSwv0I5+RNaIUjiFmSC1dwzkoRcldluXMOuf+Rb+7/y9tMqHFy2WBvruhuUUDmT7+BFuhujl/IyUmelbNrWLdSGXEsCJf11OvBtocv3zCnS04DefXNJY8M=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"ap-southeast-11","n":"AIjiMJhloeH+hIzx/hpgny9zFWy+dpu03F3fXoijkq7iohjbzxqmF1iAsrx12v7I1VENN72VoALEHBIvF807fmclwF5+7R3EjzMyP/SJgEWYKecCBlk23QKGBTmDvm22/X76IIUEdlMHC/Rm88iDGchQV0Hw6jtTOJMyIuhqL/foGrJLOuwq2Jhbg6o3GZDWY8JRkRCCKV+yJZLpDLtnBG8fM2Z0bDmGJHbnHyyFDmoqAWbeSZKS2K+LnHoqd+wbQaYpTnX2fVq2AEiz+I6RD+tvWegG5Lgw5xnuST9R9d3Xp++mIg8YsSoD8agtVwOh6qxkYnq4vEEGaU8Qsm+BeNs=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"ap-southeast-22","n":"AJZzNUBnF1H6rFFiqJbiziWW7VVbyoXWH7CTUMOYzJo/7WsyJkPt95z7iLvTPR26TWg2oQIKd5Di/B5qRuPq3sg0LyEwM9QCRNyJ3be9rLSOkLCFAtwwxgonpJkMSpFwmrlrxcXQMF0xyz9IXPRgrI9KlCG0Xd/BQnV79zeMDObwMZXzj8ki1Xuh06R5XGvacNds72H5oByjeoNYzhMktqVO8pWlNKbRATyPi/HwdG8DhNH5G4TPXiBMwNhp3W/lK4JhMMgbJ01y5Xq/32ib1qSxp8ec1LKkoJdbiWxWkpXLPUahEN38+J1NeVAH+Nv8ZMqoV9n2IGIts0UJY8a0ZWc=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"ca-central-11","n":"AOj6hiK7+Xc95sDrRxq6+DIj7votGhbsLZUuOAd4leTB390jTcL1JfK77WzPi8MtaeTiGNyykdQ0HJ/qHfBoAPUPh/yhn0vXC3d7vkAn6YM0vtc9hfdMXm47yaUeIR3QIu8qwLhHzTu1q2O1QqzYYT2dftg4X55f3TZNg88GE9HIj83V/xa+8bg4gRlFHYglb6jXANh08R8goBjxjMFWg7SS5V48L5GaqYef7/RszpXIMxyYriOq9fIF0nq43zmk7KFT7/fGlXIbWcimuJKQZfTJxcMp9JK/H6YzEUTJntlFeXgYnCvLCzmRKr0i3UsgD2xJaJoOqvUtRwE3W2kZ/i8=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"eu-central-11","n":"AL9Kz62JHMpn5kBEqyoaXkM56x3l3Wi0kg0Juv71QtXo5M4ZJYxouKdcrKfevYTRNm6DE0hTbJnyj7Bh4EYbmruGdSWE970xkcFJxcgak0j4rneRX5G1E/xN27M42OOLmZCe8O6l3nksD0XGOqBPqOSEP3pYCNAYMncpSGnit56fUX+yszfMjGP3DVSUFZKtXbqwt/S0VpBi5BQbbD57R8DKenQsPfln91tgGopmXP66vZ4yWRUzs/mqHxcez3FcgHHXc6AbEJ6GOSVd9t+BCUW5kVY0aYO301PJczvB3zfsI6qebjS6BFTvMp8SqK532ZRnXEMgs/5gc9cfxpDsgvk=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"eu-west-11","n":"AKriovi9cnm+07tkfZMFFCvjfobq0TP1qjrQQ4uS91P3mt/Wy3bdVjMt6DfZeuowwfdQdcsc0XgDV1KHlIG5PKj3v6q6uH2M0mcqFpQZnIQ0xUbRoZkR6bHFgdRHR2GTbm79nh3z1gsaVYeDFGLrE7gXNQRAoKtClif4cW+ZmLAfS2nPFAg61pryh/HUdaN2zvfbTGZaB1zVL41tX5DncoQx3COLpIcdKIB//CpWO0iVubU7ZnNPRVt079t5MUpwgtyAnhqMzYWElsTAPopEWVMTxHJr1LUKXiU6nX1UoX8OxUtBCZ30xLddGXw6e8G7dZKxq/es+ov8r7IlmTI7OXM=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"eu-west-21","n":"AKPfdgeKVzCBNDbaywRWIx2/g9IIs9s4BntmaRhbhCswYjkdMLeNC6ZAydxOn8NYYdAEE29bpHtF7jpoSe6fXShOv5n/sRVlRVWEo/NuTOVckLcpqRpcjm1ujM/CA/1O16w9MyHz8tmzapG9VikHdpCh8URkaPnyuEcO2+cOP1jAZ1P2U9bhx9cKxXfe1Vr9DrvDexCVqQ0vLw0ZbjN7nU2yAkim7O1CX6+fOMTsEMC+WX+fDb0RZVJ2hPqUT+dDY2Nnta69/8rI51C5f5+NVjKr+DgHYeaPGmq2AZ762PWsCKcNU8UgB+guXM2UxoRU+V0DLVWgtf8AxojhWgpJntM=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"us-east-11","n":"AIvLE/h4h9XdAVyy0C7fn1ZXZ3Gt6YT2LPsHsoCUGgPAVJnLJjPRj3dSI2UmlWaLacSoHYeFABfxj8YROnE9fpiGto5LcdyfuRKET9Nv5UaZp0kMSSoF7wXinp07ACUbn+ZE3ImQR16r1/Q/j3AD4CmN7gVjk5+EZzVCTQtAzJZJ8/EgCPFE4YA0Q2UgFtBjZnt4SI8TljikBqUmNDVKyjh2yI+m4fQO/LZOEaI/aGOWYen4RrO+/3hTYk73b+oFCPnIp1sLNUmdAHzjIgWYCC2qBwC+tRWi7065ea2KYj+kNNFevXFYMrph3U1mxqDZSzIOvEXIlZqlhOoOc5NmWMc=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"us-east-21","n":"AIrl+VgezCW0WK81WBUNl6CIuuP+nI7TnKgKvNKMdpuHmUhdwDJwxLr+Qe4G6jQSpHNzuwRoQ8zPxkkyeHP5722tmtjUFBtx6GJ6YCIGAIGNuFRIr3uWWLUVF8IVbLswq/XbuvN8oJNl0039AlUOgTI0SdHAGenQjOHTA2Mx274JDrK85UNC1euAzcEEdYmBHWE/llRLmjy5JexKS/i+B23S+18FA+W5s2+kDCnaIn3iHbMUzsoRdn616C738KxiCHIGYP9JSwYy/2IqqSeRE/0qLAxZ1cYU3UkihTSkzsCNnvhqOf3Hn5mR4onfh4iWEghV8lCS6wywFoxAuPMG6Uc=","e":"AQAB"},
    {"kty":"RSA","alg":"RS512","use":"sig","kid":"us-west-21","n":"AJM4O/eTg8U00rbo/xXwECyAmpF8EUvbBj+nMvebhExjWyNhaEB27QvESbdM3FS+k8opxC5TKVqNCY8GGVAvHkTh5+BsaIeFrJLj22rXXs6E3bse5MBlmUHCIy8PQaZ/BpJWvlSz7IoprdfhgfOGvT96GgXouSytanvkU4A8a3jcmy2ZmdHSdeGLuAYQtdz+xP8zt2s2v2evFY/bEGQpd0EBlWsQKZvtZ0DJ1CtA/SJixbdhCj7bGh322QqgA8im+s3AAnD4I/UgfvZEAbkH6zqYgWTq5QnMsoizESf+6EmSDaJA4Bbkv1ffmcHuTEUwKnKZ+d7G5YXWwWndXu4tleM=","e":"AQAB"},
  ];

class OpenIdClient {
  private validatedTokens = new Map<string, TokenData>();

  public getTokenClaims = async (token: string): Promise<TokenData> => {
    let tokenClaims = this.validatedTokens.get(token);
    if (tokenClaims) {
      return tokenClaims;
    }

    const { header } = jwt.decode(token, { complete: true });
    const jwk = providerJwks.filter(c => c.kid === header.kid)[0];
    if (!jwk) {
      throw new Error("Invalid Token: cannot validate");
    }
    const { iss, sub, email, name, exp } = jwt.verify(token, jwkToPem(jwk));
    tokenClaims = { iss, sub, email, name, exp };
    this.validatedTokens.set(token, tokenClaims);
    return tokenClaims;
  };

  public exchangeTokenCode = async (params, redirectUri) => {
    const formData = new URLSearchParams();
    formData.set('grant_type', 'authorization_code');
    formData.set('code', params.code);
    formData.set('client_id', process.env.CLIENT_ID!);
    formData.set('client_secret', process.env.CLIENT_SECRET!);
    formData.set('redirect_uri', redirectUri);
    const body = `${formData.toString()}`;
    const resp = await fetch(providerConfig.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (resp.ok) {
      return await resp.json();
    }
    throw new Error(resp.statusText);
  }

  public refreshToken = async (refreshToken) => {
    const formData = new URLSearchParams();
    formData.set('grant_type', 'refresh_token');
    formData.set('refresh_token', refreshToken);
    formData.set('client_id', process.env.CLIENT_ID!);
    formData.set('client_secret', process.env.CLIENT_SECRET!);
    const body = `${formData.toString()}`;
    const resp = await fetch(providerConfig.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const respBody = await resp.json();
    return respBody; 
  }
}

export default new OpenIdClient();
