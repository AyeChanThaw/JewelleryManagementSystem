/**
 * Customer Routes
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

class CustomerRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/customer").all(Permission.onLoad).get(this.getList);
    this.route("/customer/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/customer/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/customer/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/customer", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/customer/entry", params: {}, listUrl: "/customer" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "CUS";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .where("prefix", prefix)
      .select()
      .then((result) => {
          if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
          } else {
          count++;
          result[0].lastdate = datecode;
          }
          const code = prefix + datecode + count;
          params.params.code = code;

          if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
          } else {
          return Promise.resolve("");
          }
      })
      .then((result) => {
          params.token = result;
          res.render("dashboard/customer-entry", params);
      })
      .catch((err: any) => {
          next(err);
      });

    // if (typeof (<any>req).jwtToken == "function") {
    //   (<any>req).jwtToken(jwtCredentialId)
    //     .then((result: string) => {
    //       params.token = result;
    //       res.render("dashboard/customer-entry", params);
    //     })
    //     .catch((err: any) => {
    //       next(err);
    //     });

    // } else {
    //   res.render("dashboard/customer-entry", params);
    // }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    // data.customer_dob = Utils.toSqlDateWithM(data.customer_dob);
    data.id = uuid.v4();
    const prefix = "CUS";
    let count = 0;
    const updatdate = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());

    const db = RestApi.getDb("customer");
    RestApi.getDb("autogenerate")
      .select()
      .where("prefix", prefix)
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        data.code = prefix + datecode + count;
        return RestApi.getDb("autogenerate").where("prefix", prefix).update({ currentvalue: count, lastdate: datecode, updateddate: Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        return db.insert(data, "id");
      })
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
    const postUrl = `/customer/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/customer" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("customer").where({ id: data.id }).select()
      .then((result) => {
        // result[0].customer_dob = Utils.toDisplayDate(result[0].customer_dob);
        params.params = Utils.mixin(data, result[0]);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/customer-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.updateddate = Utils.toSqlDate(new Date());

    let db = RestApi.getDb("customer");
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
    let order_diamonds: any = [];
    let order_golds: any = [];
    let sale_diamonds: any = [];
    let sale_golds: any = [];
    let return_outside_diamonds: any = [];
    let return_outsides: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("customer");
    db = db.where({ id: data.id });
    RestApi.getDb("order_diamond")
      .where("customer_id", data.id)
      .select()
      .then((result) => {
        order_diamonds = result;
        return RestApi.getDb("order_gold").where("customer_id", data.id).select();
      })
      .then((result) => {
        order_golds = result;
        return RestApi.getDb("sale_diamond").where("customer_id", data.id).select();
      })
      .then((result) => {
        sale_diamonds = result;
        return RestApi.getDb("sale_gold").where("customer_id", data.id).select();
      })
      .then((result) => {
        sale_golds = result;
        return RestApi.getDb("return_outside_diamond").where("customer_id", data.id).select();
      })
      .then((result) => {
        return_outside_diamonds = result;
        return RestApi.getDb("return_outside").where("customer_id", data.id).select();
      })
      .then((result) => {
        return_outsides = result;
        if (order_diamonds.length > 0 || order_golds.length > 0 || sale_diamonds.length > 0 || sale_golds.length > 0 || return_outside_diamonds.length > 0 || return_outsides.length > 0) {
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

export default new CustomerRouter();