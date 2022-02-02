/**
 * Goldsmithorder Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import moment from "moment";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class OpeningAmountRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/opening-amount").all(Permission.onLoad).get(this.getList);
    this.route("/opening-amount/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/opening-amount/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/opening-amount/delete/:id").all(Permission.onLoad).post(this.postDelete);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname, user: req.user.username };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/opening-amount", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/opening-amount", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/opening-amount/entry", params: {}, listUrl: "/opening-amount" };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.params.date = moment(new Date()).format("DD/MM/YYYY");
          res.render("dashboard/opening-amount-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/opening-amount-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    const daily_cash: any = {};
    const query: any = [];
    daily_cash.id = uuid.v4();
    daily_cash.date = data.date;
    daily_cash.type_id = data.id;
    daily_cash.cash_in = data.open_balance;
    daily_cash.status = "open_balance";
    daily_cash.type = " openamount";
    daily_cash.user_id = req.user.id;
    daily_cash.createddate = Utils.toSqlDate(new Date());
    daily_cash.updateddate = Utils.toSqlDate(new Date());

    query.push(RestApi.getDb("openamount").insert(data, "id"));
    query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));
    // RestApi.getDb("openamount").insert(data, "id")
    //   .then((result) => {
    //     data.data = result;
    //     return RestApi.getDb("daily_cash").insert(daily_cash, "id");
    //   })
    RestApi.getKnex().transaction(function (trx) {
        Promise.all(query)
          .then(trx.commit)
          .catch(trx.rollback);
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

    const postUrl = `/opening-amount/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/opening-amount" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("openamount").where({ id: data.id }).select()
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
        res.render("dashboard/opening-amount-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response) {
    const data = comfunc.fillDefaultFields(req.body);
    const id = data.id;
    data.id = req.params.id;
    data.date = Utils.toSqlDate(data.date);
    let db = RestApi.getDb("openamount");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    db = db.where({ id: data.id });
    delete data.id;
    db.update(data, "id")
      .then((result) => {
        return RestApi.getDb("daily_cash").where("type_id", id).update({ "cash_in": data.open_balance, "updateddate": Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postDelete(req: express.Request, res: express.Response) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("openamount");
    db = db.where({ id: data.id });
    RestApi.getDb("daily_cash")
            .where("type_id", data.id)
            .delete("id")
            .then(() => {
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

export default new OpeningAmountRouter();