/**
 * Diamond Settlement Routes
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

class DiamondSettlementRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/diamond-settlement").all(Permission.onLoad).get(this.getList);
    this.route("/diamond-settlement/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/diamond-settlement/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/diamond-settlement/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/diamond-settlement", params);
        })
        .catch((err: any) => {
          console.log("er : ", err);
          next(err);
        });

    } else {
      res.render("dashboard/diamond-settlement", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/diamond-settlement/entry", params: {}, listUrl: "/diamond-settlement" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.debt_array = [];
          res.render("dashboard/diamond-settlement-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/diamond-settlement-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    const diamond_debt_id = data.diamond_debt_id;
    const wholediamond_id = data.wholediamond_id;
    const pay_amount = data.pay_amount;
    const pay_carat = data.pay_carat;
    const voc_no = data.voc_no;
    const settlement_arr: any = [];
    const dailycash_arr: any = [];
    const query: any = [];
    let cash_out: any = 0;
    const date = Utils.toSqlDate(new Date());
    RestApi.getDb("diamond_debt")
        .leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id")
        .where("diamond_debt.supplier_id", data.supplier_id)
        .select()
        .then((result) => {
            result.forEach((debt: any) => {
            if (typeof voc_no == "object") {
                voc_no.forEach((item: any, index: number) => {
                if (debt.voc_no == item && pay_amount[index] > 0) {
                    const settlement: any = {
                        id: uuid.v4(),
                        date: Utils.toSqlDate(new Date()),
                        user_id: req.user.id,
                        supplier_id: data.supplier_id,
                        diamond_debt_id: diamond_debt_id[index],
                        wholediamond_id: wholediamond_id[index],
                        amount: pay_amount[index],
                        carat: pay_carat[index],
                        exchange_rate: data.exchange_rate,
                        createddate: date,
                        updateddate: date
                    };
                    settlement_arr.push(settlement);
                    query.push(RestApi.getDb("diamond_debt").where("wholediamond_id", wholediamond_id[index]).decrement("balance", pay_amount[index]).decrement("debt_carat", pay_carat[index]).update({"updateddate": date }));
                    cash_out = settlement.amount * data.exchange_rate;
                    query.push(RestApi.getDb("supplier").where("id", data.supplier_id).decrement("pay_usd", settlement.amount));
                    const daily_cash: any = {
                      id: uuid.v4(),
                      date: date,
                      type_id: settlement.id,
                      cash_out: cash_out,
                      status: "purchase",
                      type: "diamond_settlement",
                      user_id: req.user.id,
                      createddate: date,
                      updateddate: date
                    };
                    dailycash_arr.push(daily_cash);
                    // query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));
                }
                });
            } else {
              if (debt.voc_no == voc_no && pay_amount > 0) {
                const settlement: any = {
                    id: uuid.v4(),
                    date: date,
                    user_id: req.user.id,
                    supplier_id: data.supplier_id,
                    diamond_debt_id: diamond_debt_id,
                    wholediamond_id: wholediamond_id,
                    amount: pay_amount,
                    carat: pay_carat,
                    exchange_rate: data.exchange_rate,
                    createddate: date,
                    updateddate: date
                };
                settlement_arr.push(settlement);
                query.push(RestApi.getDb("diamond_debt").where("wholediamond_id", wholediamond_id).decrement("balance", pay_amount).decrement("debt_carat", pay_carat).update({"updateddate": date }));
                // query.push(RestApi.getDb("diamond_debt").where("wholediamond_id", wholediamond_id).update({"balance": function() { return this - pay_amount }, "debt_carat": function() { return this - pay_carat }, "updateddate": date }));
                // query.push(RestApi.getDb("debt").where("wholediamond_id", wholediamond_id).decrement("balance", pay_amount));
                cash_out = settlement.amount * data.exchange_rate;
                query.push(RestApi.getDb("supplier").where("id", data.supplier_id).decrement("pay_usd", settlement.amount));
                const daily_cash: any = {
                    id: uuid.v4(),
                    date: date,
                    type_id: settlement.id,
                    cash_out: cash_out,
                    status: "purchase",
                    type: "diamond_settlement",
                    user_id: req.user.id,
                    createddate: Utils.toSqlDate(new Date()),
                    updateddate: Utils.toSqlDate(new Date())
                };
                dailycash_arr.push(daily_cash);
                // query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));
                }
              }
            });
            return Promise.all(query);
        })
        .then((result) => {
            return RestApi.getKnex().batchInsert("diamond_settlement", settlement_arr);
        })
        .then((result) => {
            return RestApi.getKnex().batchInsert("daily_cash_showroom", dailycash_arr);
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
    const postUrl = `/diamond-settlement/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/diamond-settlement" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("diamond_settlement")
      .leftJoin("diamond_debt", "diamond_debt_id", "diamond_debt.id")
      .leftJoin("whole_diamond", "diamond_settlement.wholediamond_id", "whole_diamond.id")
      .where("diamond_settlement.id", data.id)
      .select("diamond_settlement.id", "diamond_settlement.diamond_debt_id", "diamond_settlement.supplier_id", "diamond_settlement.wholediamond_id", "diamond_settlement.amount as pay_amount", "diamond_settlement.carat as pay_carat", "diamond_settlement.createddate", "diamond_settlement.exchange_rate", "diamond_debt.balance as amount", "diamond_debt.debt_carat as carat", "whole_diamond.voc_no")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        result[0].amount += result[0].pay_amount;
        result[0].carat += result[0].pay_carat;
        params.supplier_id = result[0].supplier_id;
        params.diamond_debt_array = Utils.mixin(data, result[0]);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/diamond-settlement-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const balance = data.amount - data.pay_amount;
    const carat = data.carat - data.pay_carat;
    const amount = data.pay_amount * data.exchange_rate;
    const date = Utils.toSqlDate(new Date());
    const query: any = [];
    data.amount = data.pay_amount;
    data.carat = data.pay_carat;
    data.updateddate = date;
    let db = RestApi.getDb("diamond_settlement");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.pay_amount);
    delete (data.pay_carat);
    RestApi.getDb("diamond_settlement")
      .where("id", data.id)
      .select()
      .then((result) => {
        const pay_usd = data.amount - result[0].amount;
        query.push(RestApi.getDb("supplier").where("id", result[0].supplier_id).decrement("pay_usd", pay_usd));
        query.push(RestApi.getDb("diamond_debt").where("id", data.diamond_debt_id).update({"balance": balance, "debt_carat": carat, "updateddate": date}, "id"));
        query.push(RestApi.getDb("daily_cash_showroom").where("type_id", data.id).update({"cash_out": amount, "updateddate": date}, "id"));
        delete (data.id);
        return Promise.all(query);
      })
      .then((result) => {
        return db.update(data, "id");
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
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("diamond_settlement")
      .where("id", data.id)
      .select()
      .then((result) => {
        query.push(RestApi.getDb("diamond_debt").where("id", result[0].diamond_debt_id).increment("balance", result[0].amount).increment("debt_carat", result[0].carat));
        query.push(RestApi.getDb("supplier").where("id", result[0].supplier_id).increment("pay_usd", result[0].amount));
        return Promise.all(query);
      })
      .then((result) => {
        return RestApi.getDb("daily_cash_showroom").where("type_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getDb("diamond_settlement").where({ id: data.id }).delete("id");
      })
    // let db = RestApi.getDb("settlement");
    // db = db.where({ id: data.id });
    // db.delete("id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new DiamondSettlementRouter();