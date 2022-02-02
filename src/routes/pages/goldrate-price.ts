/**
 * Goldrate Price Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class GoldratePriceRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/goldrate-price").all(Permission.onLoad).get(this.getList);
    this.route("/goldrate-price/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/goldrate-price/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/goldrate-price/delete/:id").all(Permission.onLoad).post(this.postDelete);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/goldrate-price", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/goldrate-price", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/goldrate-price/entry", params: {}, listUrl: "/goldrate-price" };
    params = Permission.getMenuParams(params, req, res);

    // RestApi.getDb("goldratesetting")
    //   .select("a_setting", "b_setting", "c_setting", "d_setting")
    //   .first()
    //   .then((result) => {
    //     params.goldratesetting = result;
    //     if (typeof (<any>req).jwtToken == "function") {
    //       (<any>req).jwtToken(jwtCredentialId)
    //         .then((result: string) => {
    //           params.token = result;
    //           res.render("dashboard/goldrate-price-entry", params);
    //         })
    //         .catch((err: any) => {
    //           next(err);
    //         });

    //     } else {
    //       res.render("dashboard/goldrate-price-entry", params);
    //     }
    //   })
      // .catch((err) => {
      //   console.log("err ", err);
      //   res.render("dashboard/goldrate-price-entry", params);
      // });
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/goldrate-price-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/goldrate-price-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFieldsWithDateTime(req.body);
    data.id = uuid.v4();

    // delete data.a_setting;
    // delete data.b_setting;
    // delete data.c_setting;
    // delete data.d_setting;
    console.log("data ", data);
    const db = RestApi.getDb("goldrate_price");
    db.insert(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }

    const postUrl = `/goldrate-price/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/goldrate-price" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("goldrate_price").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);

        return RestApi.getDb("goldratesetting").select("a_setting", "b_setting", "c_setting", "d_setting").first();
      })
      .then((result) => {
        params.goldratesetting = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/goldrate-price-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFieldsWithDateTime(req.body);

    let db = RestApi.getDb("goldrate_price");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    db.update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("goldrate_price");
    db = db.where({ id: data.id });
    db.delete("id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new GoldratePriceRouter();