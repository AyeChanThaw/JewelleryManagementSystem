/**
 * Purchase Gold Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import { Permission } from "../../lib/permission";
import moment from "moment";

const jwtCredentialId = config.jwt.defCredentialId;

class PurchaseGoldRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/purchase-gold").all(Permission.onLoad).get(this.getList);
    this.route("/purchase-gold/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/purchase-gold/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/purchase-gold/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/purchase-gold", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/purchase-gold", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: { id: req.user.id, name: req.user.username }, postUrl: "/purchase-gold/entry", params: {}, listUrl: "/purchase-gold" };
    params.user = params.user.name;
    params = Permission.getMenuParams(params, req, res);
    params.params.cashier_name = req.user.username;
    params.params.cashier_id = req.user.id;
    const prefix = "PG";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .select("*")
      .where("prefix", prefix)
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        result[0].currentvalue = count;
        result[0].lastdate = Utils.toGeneratecodeDate(new Date());
        result[0].updateddate = Utils.toSqlDate(new Date());
        const autogenId = result[0].id;
        delete (result[0].id);
        const voc_no = prefix + datecode + count;
        params.params.voc_no = voc_no;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/purchase-gold-entry", params);
      })
      .catch((err) => {
        console.log("err ", err);
        res.render("dashboard/purchase-gold-entry", params);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    data.id = uuid.v4();
    delete (data.cashier_name);
    // if (data.paymenttype == "cash")
    //   data.debtprice = 0;
    // else
    //   data.debtprice = data.total_price;
    data.paymenttype = "cash";
    data.debtprice = 0;
    const query: any = [];
    let debt: any = {};
    const daily_cash: any = {};

    // if (data.paymenttype == "debt") {
    //   debt.id = uuid.v4();
    //   debt.date = Utils.toSqlDate(new Date());
    //   debt.supplier_id = data.supplier_id;
    //   debt.parent_id = data.id;
    //   debt.user_id = req.user.id;
    //   debt.currency = "MMK";
    //   debt.amount = data.total_price;
    //   debt.balance = data.total_price;
    //   debt.status = "purchase-gold";
    //   debt = comfunc.fillDefaultFields(debt);
    //   query.push(RestApi.getDb("debt").insert(debt, "id"));
    //   query.push(RestApi.getDb("supplier").where("id", data.supplier_id).increment("pay_mmk", data.total_price));
    // } else {
      daily_cash.id = uuid.v4();
      daily_cash.date = Utils.toSqlDate(new Date());
      daily_cash.type_id = data.id;
      daily_cash.cash_out = data.total_price;
      daily_cash.status = "purchase";
      daily_cash.type = "purchase_gold";
      daily_cash.user_id = req.user.id;
      daily_cash.createddate = Utils.toSqlDate(new Date());
      daily_cash.updateddate = Utils.toSqlDate(new Date());
    // }

    RestApi.getDb("purchase_gold").insert(data, "id")
      .then((result) => {
        // if (data.paymenttype == "debt") {
        //   return Promise.all(query);
        // } else {
          return RestApi.getDb("daily_cash").insert(daily_cash, "id");
        // }
      })
      .then((result) => {
        const prefix = "PG";
        return RestApi.getDb("autogenerate")
          .select("*")
          .where("prefix", prefix);
      })
      .then((result) => {
        const datecode = Utils.toGeneratecodeDate(new Date());
        let count = 0;
        let autogenresult: any = [];
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        result[0].currentvalue = count;
        result[0].lastdate = Utils.toGeneratecodeDate(new Date());
        result[0].updateddate = Utils.toSqlDate(new Date());
        autogenresult = result[0];
        const autogenId = result[0].id;
        delete (result[0].id);

        if (result[0].lastdate == datecode) {
          return RestApi.getDb("autogenerate").where("id", autogenId).update(result[0], "id") as PromiseLike<any>;
        } else {
          return RestApi.getDb("autogenerate").insert(autogenresult) as PromiseLike<any>;
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

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    let purchase_data: any;
    const postUrl = `/purchase-gold/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/purchase-gold" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("purchase_gold")
      .leftJoin("user", "purchase_gold.cashier_id", "user.id")
      .where({ "purchase_gold.id": data.id })
      .select("purchase_gold.*", "user.username as cashier_name")
      .then((result) => {
        purchase_data = result;
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        if (params.params.cashier_id == "1") {
          params.params.cashier_name = "admin";
        }

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/purchase-gold-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    delete (data.cashier_name);
    data.date = Utils.toSqlDate(data.date);
    data.updateddate = Utils.toSqlDate(new Date());
    data.paymenttype = "cash";
    if (data.isfinished == "on" || data.isfinished == "1") {
      data.isfinished = 1;
    }
    else {
      data.isfinished = 0;
    }
    if (data.paymenttype == "cash")
      data.debtprice = 0;
    else
      data.debtprice = data.total_price;

    // generate MoCode depends on mo gram
    const query: any = [];
    let debt: any = {};
    const daily_cash: any = {};

    // if (data.paymenttype == "debt") {
    //   debt.id = uuid.v4();
    //   debt.date = Utils.toSqlDate(new Date());
    //   debt.supplier_id = data.supplier_id;
    //   debt.parent_id = data.id;
    //   debt.user_id = req.user.id;
    //   debt.currency = "MMK";
    //   debt.amount = data.total_price;
    //   debt.balance = data.total_price;
    //   debt.status = "purchase-gold";
    //   debt = comfunc.fillDefaultFields(debt);
    //   query.push(RestApi.getDb("debt").where({"parent_id": data.id, "status": "purchase-gold"}).delete());
    //   query.push(RestApi.getDb("debt").insert(debt, "id"));
    //   query.push(RestApi.getDb("supplier").where("id", data.supplier_id).increment("pay_mmk", data.total_price));
    // } else {
      daily_cash.id = uuid.v4();
      daily_cash.date = Utils.toSqlDate(new Date());
      daily_cash.type_id = data.id;
      daily_cash.cash_out = data.total_price;
      daily_cash.status = "purchase";
      daily_cash.type = "purchase_gold";
      daily_cash.user_id = req.user.id;
      daily_cash.createddate = Utils.toSqlDate(new Date());
      daily_cash.updateddate = Utils.toSqlDate(new Date());
      query.push(RestApi.getDb("daily_cash").where({"type_id": data.id, "type": "purchase_gold"}).delete());
      query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));
    // }

    RestApi.getDb("purchase_gold")
      .where("id", data.id)
      .select()
      .then((result) => {
        // if (result.length > 0) {
        //   if (result[0].paymenttype == "debt")
        //     query.push(RestApi.getDb("supplier").where("id", result[0].supplier_id).decrement("pay_mmk", result[0].total_price));
        // }
        return RestApi.getDb("purchase_gold").where({ id: data.id }).update(data, "id");
      })
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
    const query: any = [];

    RestApi.getDb("purchase_gold")
      .where("id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
          // if (result[0].paymenttype == "cash") {
            query.push(RestApi.getDb("daily_cash").where({ "type_id": data.id, "type": "purchase_gold" }).delete());
          // } else {
          //   query.push(RestApi.getDb("debt").where({ "parent_id": data.id, "status": "purchase-gold" }).delete());
          //   query.push(RestApi.getDb("supplier").where("id", result[0].supplier_id).decrement("pay_mmk", result[0].total_price));
          // }
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("purchase_gold").where({ id: data.id }).delete("id");
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

export default new PurchaseGoldRouter();