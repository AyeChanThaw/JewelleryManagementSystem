/**
 * GoldRaw Routes
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

class GoldRawRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/goldraw").all(Permission.onLoad).get(this.getList);
    this.route("/goldraw/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/goldraw/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/goldraw/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/goldraw", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/goldraw", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/goldraw/entry", params: {}, listUrl: "/goldraw" };
    params = Permission.getMenuParams(params, req, res);

    const prefix = "GR";
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
        const voc_no = prefix + datecode + count;
        params.params.code = voc_no;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/goldraw-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const prefix = "GR";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    data.id = uuid.v4();
    data.date = Utils.toSqlDateWithM(data.date);
    let debt: any = {};
    if (data.paymenttype == "debt") {
      debt.id = uuid.v4();
      debt.date = Utils.toSqlDate(new Date());
      debt.supplier_id = data.supplier_id;
      debt.goldraw_id = data.id;
      debt.user_id = req.user.id;
      debt.amount = data.netprice;
      debt.balance = data.netprice;
      debt = comfunc.fillDefaultFields(debt);
    }

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
        data.code = prefix + datecode + count;
        return RestApi.getDb("autogenerate").where("prefix", prefix).update({ currentvalue: count, lastdate: datecode, updateddate: Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        if (data.paymenttype == "debt") {
          return RestApi.getDb("debt").insert(debt, "id");
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("goldraw").insert(data, "id");
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

    const postUrl = `/goldraw/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/goldraw" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("goldraw").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.date = Utils.toDisplayDate(params.params.date);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/goldraw-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDateWithM(data.date);

    let db = RestApi.getDb("goldraw");
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
    let db = RestApi.getDb("goldraw");
    db = db.where({ id: data.id });
    RestApi.getDb("debt")
      .where("goldraw_id", data.id)
      .delete("id")
      .then((result) => {
        return db.delete("id");
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

export default new GoldRawRouter();