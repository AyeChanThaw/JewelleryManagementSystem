/**
 * User Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import config from "../../../data/config.json";
import * as passport from "../../config/passport-config";

const jwtCredentialId = config.jwt.defCredentialId;

class UserRouter extends ExpressRouter {
  constructor() {
    super();

    /* Login route. */
    this.route("/login").get(this.getLogin).post(this.postLogin);
    /* Log out route */
    this.route("/logout").all(this.logout);
    /* Register route */
    this.route("/register").get(this.doSomething);
    /* Change password route */
    this.route("/changepwd").get(this.getChangePassword).post(this.postChangePassword);
  }

  static buildAlert(type: string, message: string): string {
    const cssClass = (type == "error") ? "danger" : type;
    const title = type.toUpperCase();
    return `<div class='alert alert-${cssClass} alert-dismissible' role='alert'><strong>${title}:</strong> ${message}
  <button class='close' type='button' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>
  </div>`;
  }

  public getLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: "Login" };
    params.url = req.query.url || "/";
    if (typeof (<any>req).csrfToken == "function") {
      params.csrfToken = (<any>req).csrfToken();
    }

    res.render("auth/login", params);
  }

  public postLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
    passport.default.authenticate("local", (err, user) => {
      const params: any = { title: config.appname, user: user.username };
      params.url = req.body.url || "/dashboard";
      if (typeof (<any>req).csrfToken == "function") {
        params.csrfToken = (<any>req).csrfToken();
      }

      if (err) {
        params.message = UserRouter.buildAlert("error", err.message);
        res.render("auth/login", params);

      } else if (!user) {
        params.message = UserRouter.buildAlert("error", "Invalid login user!");
        res.render("auth/login", params);

      } else {
        req.logIn(user, { session: true }, (errLogin) => {
          if (errLogin) {
            return next(err);
          }
          return res.redirect("/dashboard");
        });
      }
    })(req, res, next);
  }

  public logout(req: express.Request, res: express.Response, next: express.NextFunction) {
    req.logOut();
    res.redirect("/");
  }

  public getChangePassword(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated() && req.user) {
      const params: any = { title: config.appname, user: req.user.username, params: req.user };
      params.url = req.query["url"] || "/dashboard";
      params.message = {
        status: "",
        title: "",
        msg: ""
      };
      if (typeof (<any>req).csrfToken == "function") {
        params.csrfToken = (<any>req).csrfToken();
      }

      res.render("auth/changepassword", params);
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public postChangePassword(req: express.Request, res: express.Response, next: express.NextFunction) {
    const redirectUrl = req.body.redirecturl || "/dashboard";
    const outFunc = (data: any, msgtype: string, msg: string) => {
      const params: any = { title: config.appname, user: req.user.username, params: data, url: redirectUrl };
      // params.message = UserRouter.buildAlert(msgtype, msg);
      params.message = {
        status: (msgtype == "error") ? "danger" : msgtype,
        title: msgtype.toUpperCase(),
        msg: msg
      };
      if (typeof (<any>req).csrfToken == "function") {
        params.csrfToken = (<any>req).csrfToken();
      }

      res.render("auth/changepassword", params);
    };

    if (req.isAuthenticated() && req.user) {
      const data = req.body;
      const user = req.user;
      const id = user.id || -1;
      const password = user.password || "";
      if (data.id && data.id == id) {
        const oldpassword = passport.md5(data.oldpassword);
        if (password != oldpassword) {
          outFunc(data, "error", "Old Password does not match!");
        } else if (data.newpassword != data.confirmpassword) {
          outFunc(data, "error", "Confirm Password does not match!");
        } else {
          const saveData = {
            id: id,
            usertype: user.usertype,
            username: user.username,
            password: passport.md5(data.newpassword)
          };

          passport.default.updateSystemUser(saveData)
            .then((result) => {
              if (result) {
                outFunc(data, "success", "Password has changed!");
              } else {
                outFunc(data, "error", "Password can not changed!");
              }
            })
            .catch((err) => {
              outFunc(data, "error", "Password can not changed!");
            });
        }
      } else {
        res.redirect(redirectUrl);
      }

    } else {
      res.redirect(redirectUrl);
    }
  }

  public doSomething(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.send("Hello world!");
  }
}

export default new UserRouter();