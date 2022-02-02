/**
 * Sale Person Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as passport from "../../config/passport-config";
import * as uuid from "uuid";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class SalePersonRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/sale-person").all(Permission.onLoad).get(this.getList);
    this.route("/sale-person/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/sale-person/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/sale-person/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/sale-person", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-person", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/sale-person/entry", params: {}, listUrl: "/sale-person" };
    params = Permission.getMenuParams(params, req, res);

    // if (typeof (<any>req).jwtToken == "function") {
    //   (<any>req).jwtToken(jwtCredentialId)
    //     .then((result: string) => {
    //       params.token = result;
    //       res.render("dashboard/sale-person-entry", params);
    //     })
    //     .catch((err: any) => {
    //       next(err);
    //     });

    // } else {
    //   res.render("dashboard/sale-person-entry", params);
    // }
    RestApi.getDb("sale_person").select()
      .then((result) => {
        params.salepeople = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          res.render("dashboard/sale-person-entry", params);
        }
      })
      .then((result: string) => {
        params.token = result;
        res.render("dashboard/sale-person-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    data.password = passport.md5(req.body.password || "");
    delete (data.confirm_password);
    delete (data.salepeople);

    const db = RestApi.getDb("sale_person");
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
    const postUrl = `/sale-person/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/sale-person" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("sale_person").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);

        return RestApi.getDb("sale_person").whereNot({ id: data.id }).select();
      })
      .then((result) => {
        params.salepeople = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/sale-person-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const password = req.body.password || "";
    if (password == "") delete (data.password);
    else data.password = passport.md5(password);

    let db = RestApi.getDb("sale_person");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    delete (data.confirm_password);
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
    let carts: any = [];
    let sale_diamonds: any = [];
    let sale_golds: any = [];
    let order_diamonds: any = [];
    let order_golds: any = [];
    let return_outsides: any = [];
    let return_outside_diamonds: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("sale_person");
    db = db.where({ id: data.id });
    RestApi.getDb("cart")
      .where("sale_person_id", data.id)
      .select()
      .then((result) => {
        carts = result;
        return RestApi.getDb("order_diamond").where("sale_person_id", data.id).select();
      })
      .then((result) => {
        order_diamonds = result;
        return RestApi.getDb("order_gold").where("sale_person_id", data.id).select();
      })
      .then((result) => {
        order_golds = result;
        return RestApi.getDb("sale_diamond").where("sale_person_id", data.id).select();
      })
      .then((result) => {
        sale_diamonds = result;
        return RestApi.getDb("sale_gold").where("sale_person_id", data.id).select();
      })
      .then((result) => {
        sale_golds = result;
        return RestApi.getDb("return_outside_diamond").where("sale_person_id", data.id).select();
      })
      .then((result) => {
        return_outside_diamonds = result;
        return RestApi.getDb("return_outside").where("sale_person_id", data.id).select();
      })
      .then((result) => {
        return_outsides = result;
        if (carts.length > 0 || order_diamonds.length > 0 || order_golds.length > 0 || sale_diamonds.length > 0 || sale_golds.length > 0 || return_outside_diamonds.length > 0 || return_outsides.length > 0) {
          throw new Error("Can not Delete. Already Used.");
        } else {
          return db.delete("id");
        }
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new SalePersonRouter();