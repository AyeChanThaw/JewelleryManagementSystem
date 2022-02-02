/**
 * Auth
 */
import * as RestApi from "../lib/restapi";
import * as passport from "../config/passport-config";

export class Auth {
  constructor() { }

  public index(args: any, cb: Function) {
    cb(undefined, {
      error: {
        message: "Register error"
      }
    });
  }

  public login(args: any, cb?: any) {
    const password = passport.md5(args.password);
    RestApi.getDb("sale_person")
      .where({ "sale_person_name": args.username, "password": password })
      .leftJoin("branch", "branch_id", "branch.id")
      .select("sale_person.id", "sale_person.sale_person_name", "branch.branch_name")
      .then((result) => {
        if (result.length > 0) {
          cb(undefined, {
            data: result[0],
            // success: true,
            message: "Success."
          });
        } else {
          cb(undefined, {
            // data: "",
            // success: false,
            message: "Unsuccess."
          });
        }
      })
      .catch((err) => {
        cb(undefined, {
          // data: err,
          // success: false,
          message: err.message || "Login Error."
        });
      });
  }
}

export default new Auth();
