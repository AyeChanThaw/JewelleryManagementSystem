/**
 * WholeDiamondtype Routes
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

class WholeDiamondRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/wholediamond").all(Permission.onLoad).get(this.getList);
    this.route("/wholediamond/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/wholediamond/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/wholediamond/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/wholediamond", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/wholediamond", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/wholediamond/entry", params: {}, listUrl: "/wholediamond" };
    params = Permission.getMenuParams(params, req, res);
    const datecode = Utils.toGeneratecodeDate(new Date());

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.params.date = moment(new Date()).format("DD/MM/YYYY");
          res.render("dashboard/wholediamond-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/wholediamond-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const currentdate = Utils.toSqlDate(new Date());
    data.id = uuid.v4();
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    data.is_stock = 0;
    data.date = Utils.toSqlDate(data.date);
    data.user_id = req.user.id;
    data.current_carat = data.wgt_carat;
    if (data.paymenttype == "cash")
      data.debtprice = 0;
    else
      data.debtprice = data.netprice_usd;
    const query: any = [];
    let debt: any = {};
    const daily_cash: any = {};
    const daily_usage: any = {};
    const payment: any = {};
    if (data.isfinished == 1) {
      data.is_stock = 1;
      if (data.paymenttype == "debt") {
        debt.id = uuid.v4();
        debt.date = currentdate;
        debt.supplier_id = data.supplier_id;
        debt.wholediamond_id = data.id;
        debt.user_id = req.user.id;
        // debt.currency = "USD";
        debt.amount = data.netprice_usd;
        debt.balance = data.netprice_usd;
        debt.debt_carat = data.wgt_carat;
        debt = comfunc.fillDefaultFields(debt);
        query.push(RestApi.getDb("diamond_debt").insert(debt, "id"));
        query.push(RestApi.getDb("supplier").where("id", data.supplier_id).increment("pay_usd", data.netprice_usd));
      } else {
        daily_cash.id = uuid.v4();
        daily_cash.date = currentdate;
        daily_cash.type_id = data.id;
        daily_cash.cash_out = data.netprice_mmk;
        daily_cash.status = "purchase";
        daily_cash.type = "whole_diamond";
        daily_cash.user_id = req.user.id;
        daily_cash.createddate = currentdate;
        daily_cash.updateddate = currentdate;
        query.push(RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id"));

        daily_usage.id = uuid.v4();
        daily_usage.date = currentdate;
        daily_usage.daily_cash_type_id = "5de2a0d2-2708-4e31-8f1c-2030af6d7920";
        daily_usage.title = "Payable";
        daily_usage.total_amount = data.netprice_mmk;
        daily_usage.cash_amount = data.netprice_mmk;
        daily_usage.createddate = currentdate;
        daily_usage.updateddate = currentdate;
        query.push(RestApi.getDb("daily_usage_showroom").insert(daily_usage, "id"));

        payment.id = uuid.v4();
        payment.cash_id = daily_usage.id;
        payment.amount = data.netprice_mmk;
        payment.payment_type = "cash";
        payment.type = "usage_showroom";
        payment.createddate = currentdate;
        payment.updateddate = currentdate;
        query.push(RestApi.getDb("daily_cash_payment").insert(payment, "id"));
      }
    }
    RestApi.getDb("gemtype")
      .where("id", data.gemtype_id)
      .increment("count", 1)
      .then((result) => {
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("whole_diamond").insert(data, "id");
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
    const postUrl = `/wholediamond/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/wholediamond" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("whole_diamond").where({ id: data.id }).select()
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
        res.render("dashboard/wholediamond-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const currentdate = Utils.toSqlDate(new Date());
    const id = data.id;
    if (data.isfinished == "on" || data.isfinished == "1") {
      data.isfinished = 1;
    }
    else {
      data.isfinished = 0;
    }
    data.date = Utils.toSqlDate(data.date);
    data.user_id = req.user.id;
    data.current_carat = data.wgt_carat;
    if (data.paymenttype == "cash")
      data.debtprice = 0;
    else
      data.debtprice = data.netprice_usd;
    const query: any = [];
    let debt: any = {};
    const daily_cash: any = {};
    const daily_usage: any = {};
    const payment: any = {};
    if (data.isfinished == 1) {
      data.is_stock = 1;
      if (data.paymenttype == "debt") {
        debt.id = uuid.v4();
        debt.date = Utils.toSqlDate(new Date());
        debt.supplier_id = data.supplier_id;
        debt.wholediamond_id = data.id;
        debt.user_id = req.user.id;
        // debt.currency = "USD";
        debt.amount = data.netprice_usd;
        debt.balance = data.netprice_usd;
        debt.debt_carat = data.wgt_carat;
        debt = comfunc.fillDefaultFields(debt);
        query.push(RestApi.getDb("diamond_debt").insert(debt, "id"));
        query.push(RestApi.getDb("supplier").where("id", data.supplier_id).increment("pay_usd", data.netprice_usd));
      } else {
        daily_cash.id = uuid.v4();
        daily_cash.date = Utils.toSqlDate(new Date());
        daily_cash.type_id = data.id;
        daily_cash.cash_out = data.netprice_mmk;
        daily_cash.status = "purchase";
        daily_cash.type = "whole_diamond";
        daily_cash.user_id = req.user.id;
        daily_cash.createddate = Utils.toSqlDate(new Date());
        daily_cash.updateddate = Utils.toSqlDate(new Date());
        query.push(RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id"));

        daily_usage.id = uuid.v4();
        daily_usage.date = currentdate;
        daily_usage.daily_cash_type_id = "5de2a0d2-2708-4e31-8f1c-2030af6d7920";
        daily_usage.title = "Payable";
        daily_usage.total_amount = data.netprice_mmk;
        daily_usage.cash_amount = data.netprice_mmk;
        daily_usage.createddate = currentdate;
        daily_usage.updateddate = currentdate;
        query.push(RestApi.getDb("daily_usage_showroom").insert(daily_usage, "id"));

        payment.id = uuid.v4();
        payment.cash_id = daily_usage.id;
        payment.amount = data.netprice_mmk;
        payment.payment_type = "cash";
        payment.type = "usage_showroom";
        payment.createddate = currentdate;
        payment.updateddate = currentdate;
        query.push(RestApi.getDb("daily_cash_payment").insert(payment, "id"));
      }
    }

    let db = RestApi.getDb("whole_diamond");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: id });
    delete (data.id);
    db.update(data, "id")
      .then((result) => {
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return data;
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

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("whole_diamond");
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

export default new WholeDiamondRouter();