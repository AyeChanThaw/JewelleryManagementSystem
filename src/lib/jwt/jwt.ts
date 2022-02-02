/**
 * Json Web Token Helper
 *
 * https://github.com/mikenicholson/passport-jwt/
 * https://github.com/ExpressGateway/express-gateway
 * https://medium.com/@tanmay_patil/introduction-to-api-gateway-using-express-gateway-part-2-authorization-using-jwt-77b74cfd8766
 */
import path from "path";
import fs from "fs";
import * as jwt from "jsonwebtoken";
import http from "http";
import extractors from "./extractors";
import { HttpError } from "./httperror";

export type GetCredentialFunction = (id: string) => JwtCredential;
export type VerifyFunction = (err?: any, result?: any) => void;

export interface JwtCredential {
  readonly id: string;
  readonly consumerKey: string;
  readonly keyId: string;
  readonly keySecret: string;
  readonly isActive: boolean;
}

export interface JwtConfig {
  readonly secretOrPrivateKey?: string|Buffer;
  readonly secretOrPrivateKeyFile?: string;
  readonly secretOrPublicKey?: string|Buffer;
  readonly secretOrPublicKeyFile?: string;
  readonly jwtExtractor?: string;
  readonly jwtExtractorField?: string;
  readonly checkCredentialExistence?: boolean;

  readonly credentials?: GetCredentialFunction|[JwtCredential];

  readonly signOptions: jwt.SignOptions;
  readonly verifyOptions: jwt.VerifyOptions;
}

export class Jwt {
  private secretOrPrivateKey: string|Buffer;
  private secretOrPublicKey: string|Buffer;
  private jwtExtractor: string;
  private jwtExtractorField: string;
  private checkCredentialExistence: boolean;

  private credentials?: [JwtCredential];
  private credentialsFun?: GetCredentialFunction;

  private jwtVerifyOptions: jwt.VerifyOptions;
  private jwtSignOptions: jwt.SignOptions;

  constructor(rootPath: string, config: JwtConfig) {
    if (config.secretOrPrivateKeyFile) {
      const filePath = path.join(rootPath, config.secretOrPrivateKeyFile);
      this.secretOrPrivateKey = fs.readFileSync(filePath, "utf8");

    } else if (config.secretOrPrivateKey) {
      this.secretOrPrivateKey = config.secretOrPrivateKey;
    } else {
      throw new Error("Required secretOrPrivateKeyFile or secretOrPrivateKey");
    }

    if (config.secretOrPublicKeyFile) {
      const filePath = path.join(rootPath, config.secretOrPublicKeyFile);
      this.secretOrPublicKey = fs.readFileSync(filePath, "utf8");

    } else if (config.secretOrPublicKey) {
      this.secretOrPublicKey = config.secretOrPublicKey;
    } else {
      throw new Error("Required secretOrPublicKeyFile or secretOrPublicKey");
    }

    this.jwtExtractor = config.jwtExtractor || "authBearer";
    this.jwtExtractorField = config.jwtExtractorField;

    this.checkCredentialExistence = !!config.checkCredentialExistence;
    if (typeof config.credentials == "function") {
      this.credentialsFun = config.credentials as GetCredentialFunction;
    } else {
      this.credentials = config.credentials;
    }

    this.jwtVerifyOptions = config.verifyOptions;
    this.jwtSignOptions = config.signOptions;
  }

  private getCredential(id: string): Promise<any> {
    const self = this;

    return new Promise((resolve, reject) => {
      // const credential: any = {
      //   id: "523c71a2-9f80-434f-a555-9b193ba66444",
      //   keyId: "7dSTbOnvJ7mUF3CtNBCEst",
      //   keySecret: "7Ex0letChBSw23RfcPSqGr",
      //   isActive: true
      // };
      // resolve(credential);

      if (self.credentials && self.credentials.length) {
        const cs = self.credentials.filter((value) => {
          return value.id == id;
        });

        if (cs && cs.length > 0) {
          resolve(cs[0]);
        }

      } else if (self.credentialsFun) {
        resolve(self.credentialsFun(id));

      } else {
        reject(new HttpError(401, "Credential not found"));
      }
    });
  }

  public generateToken(credentialId: string, name?: string, expired: boolean = true): Promise<string> {
    const options = this.jwtSignOptions;
    options.algorithm = options.algorithm || "HS256";
    options.expiresIn = options.expiresIn || "1h";

    const secretOrKey = this.secretOrPrivateKey;

    const iatNum = (new Date()).getTime();

    const signPayload: any = {
      sub: credentialId,
      name: name || "",
      iat: iatNum
    };

    if (!expired) {
      delete options.expiresIn;
    }

    return new Promise((resolve, reject) => {
      this.getCredential(credentialId)
        .then((result) => {
          if (!result) {
            return reject(new HttpError(401, "Credential not found"));
          }

          jwt.sign(signPayload, secretOrKey, options, (err, token) => {
            if (err) {
              return reject(err);
            }
            resolve(token);
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public verifyHandle(req: http.IncomingMessage, done: VerifyFunction) {
    const extractor = (<any>extractors)[this.jwtExtractor](this.jwtExtractorField);
    const verifOpts: jwt.VerifyOptions = this.jwtVerifyOptions;
    verifOpts.algorithms = verifOpts.algorithms || ["HS256"];
    verifOpts.ignoreExpiration = !!verifOpts.ignoreExpiration;
    verifOpts.ignoreNotBefore = !!verifOpts.ignoreNotBefore;

    const secretOrKey = this.secretOrPublicKey;
    const token = extractor(req);
    if (!token) {
      return done(new HttpError(401, "Token not found"));
    }

    jwt.verify(token, secretOrKey, verifOpts, (jwtErr: jwt.VerifyErrors, decoded: object | string) => {
      if (jwtErr) {
        // console.log("jwt.verify", jwtErr);
        return done(jwtErr);
      }
      if (!decoded) {
        return done(new HttpError(401, "Invalid Token"));
      }

      if (!this.checkCredentialExistence) {
        return done(undefined, decoded);
      }

      const payload: any = decoded;

      if (!payload.sub) {
        return done(new HttpError(401, "Consumer Id not found"));
      }

      this.getCredential(payload.sub)
        .then((credential) => {
          if (!credential || !credential.isActive) {
            return done(new HttpError(401, "Credential not found"));
          }
          return done(undefined, credential);
        })
        .catch((err) => {
          done(err);
        });
    });
  }

  public sign(payload: string|object|Buffer = {}, secretOrPrivateKey?: jwt.Secret, options?: jwt.SignOptions): Promise<string> {
    if (!secretOrPrivateKey) {
      secretOrPrivateKey = this.secretOrPrivateKey;
    }
    return new Promise((resolve, reject) => {
      jwt.sign(payload, secretOrPrivateKey, options, (err: Error, encoded: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(encoded);
        }
      });
    });
  }

  public decode(token: string, options?: jwt.DecodeOptions): Promise<string|any> {
    return Promise.resolve(jwt.decode(token, options));
  }

  public verify(token: string, secretOrPublicKey?: string|Buffer, options?: jwt.VerifyOptions): Promise<object|string> {
    if (!secretOrPublicKey) {
      secretOrPublicKey = this.secretOrPublicKey;
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, secretOrPublicKey, options, (err: jwt.VerifyErrors, decoded: object | string) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }
}