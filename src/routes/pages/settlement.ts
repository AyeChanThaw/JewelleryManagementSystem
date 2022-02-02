/**
 * Settlement Routes
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

class SettlementRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/settlement").all(Permission.onLoad).get(this.getList);
    this.route("/settlement/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/settlement/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/settlement/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/settlement", params);
        })
        .catch((err: any) => {
          console.log("er : ", err);
          next(err);
        });

    } else {
      res.render("dashboard/settlement", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/settlement/entry", params: {}, listUrl: "/settlement" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.debt_array = [];
          res.render("dashboard/settlement-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/settlement-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    const debt_id = data.debt_id;
    const wholediamond_id = data.wholediamond_id;
    const purchase_id = data.purchase_id;
    const currency = data.currency;
    const pay_amount = data.pay_amount;
    const voc_no = data.voc_no;
    const settlement_arr: any = [];
    const dailycash_arr: any = [];
    const query: any = [];
    let cash_out: any = 0;
    RestApi.getKnex()
      .raw(`SELECT debt.*, IF(wholediamond_id IS NULL, purchase.voc_no, whole_diamond.voc_no) AS voc_no
            FROM debt
            LEFT JOIN whole_diamond ON wholediamond_id = whole_diamond.id
            LEFT JOIN purchase ON purchase_id = purchase.id
            WHERE debt.supplier_id = '` + data.supplier_id + `'`)
    // RestApi.getDb("debt")
    //   .leftJoin("whole_diamond", "debt.wholediamond_id", "whole_diamond.id")
    //   .leftJoin("purchase", "purchase_id", "purchase.id")
    //   .where("debt.supplier_id", data.supplier_id)
    //   .select("debt.*", "whole_diamond.voc_no", "purchase.voc_no")
      .then((result) => {
        result[0].forEach((debt: any) => {
          if (typeof voc_no == "object") {
            voc_no.forEach((item: any, index: number) => {
              if (debt.voc_no == item && pay_amount[index] > 0) {
                const settlement: any = {
                  id: uuid.v4(),
                  date: Utils.toSqlDate(new Date()),
                  user_id: req.user.id,
                  supplier_id: data.supplier_id,
                  debt_id: debt_id[index],
                  wholediamond_id: wholediamond_id[index],
                  purchase_id: purchase_id[index],
                  currency: currency[index],
                  amount: pay_amount[index],
                  exchange_rate: data.exchange_rate,
                  createddate: Utils.toSqlDate(new Date()),
                  updateddate: Utils.toSqlDate(new Date())
                };
                settlement_arr.push(settlement);
                if (settlement.wholediamond_id && settlement.wholediamond_id != "null") {
                  query.push(RestApi.getDb("debt").where("wholediamond_id", wholediamond_id[index]).decrement("balance", pay_amount[index]));
                } else {
                  query.push(RestApi.getDb("debt").where("purchase_id", purchase_id[index]).decrement("balance", pay_amount[index]));
                }
                if (currency[index] == "USD") {
                  cash_out = settlement.amount * data.exchange_rate;
                  query.push(RestApi.getDb("supplier").where("id", data.supplier_id).decrement("pay_usd", settlement.amount));
                } else {
                  cash_out = settlement.amount;
                  query.push(RestApi.getDb("supplier").where("id", data.supplier_id).decrement("pay_mmk", settlement.amount));
                }
                const daily_cash: any = {
                  id: uuid.v4(),
                  date: Utils.toSqlDate(new Date()),
                  type_id: settlement.id,
                  cash_out: cash_out,
                  status: "purchase",
                  type: "settlement",
                  user_id: req.user.id,
                  createddate: Utils.toSqlDate(new Date()),
                  updateddate: Utils.toSqlDate(new Date())
                };
                dailycash_arr.push(daily_cash);
                // query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));
              }
            });
          } else {
            if (debt.voc_no == voc_no && pay_amount > 0) {
              const settlement: any = {
                id: uuid.v4(),
                date: Utils.toSqlDate(new Date()),
                user_id: req.user.id,
                supplier_id: data.supplier_id,
                debt_id: debt_id,
                wholediamond_id: wholediamond_id,
                purchase_id: purchase_id,
                currency: currency,
                amount: pay_amount,
                exchange_rate: data.exchange_rate,
                createddate: Utils.toSqlDate(new Date()),
                updateddate: Utils.toSqlDate(new Date())
              };
              settlement_arr.push(settlement);
              if (settlement.wholediamond_id && settlement.wholediamond_id != "null") {
                query.push(RestApi.getDb("debt").where("wholediamond_id", wholediamond_id).decrement("balance", pay_amount));
              } else {
                query.push(RestApi.getDb("debt").where("purchase_id", purchase_id).decrement("balance", pay_amount));
              }
              if (currency == "USD") {
                cash_out = settlement.amount * data.exchange_rate;
                query.push(RestApi.getDb("supplier").where("id", data.supplier_id).decrement("pay_usd", settlement.amount));
              } else {
                cash_out = settlement.amount;
                query.push(RestApi.getDb("supplier").where("id", data.supplier_id).decrement("pay_mmk", settlement.amount));
              }
              const daily_cash: any = {
                id: uuid.v4(),
                date: Utils.toSqlDate(new Date()),
                type_id: settlement.id,
                cash_out: cash_out,
                status: "purchase",
                type: "settlement",
                user_id: req.user.id,
                createddate: Utils.toSqlDate(new Date()),
                updateddate: Utils.toSqlDate(new Date())
              };
              dailycash_arr.push(daily_cash);
              // query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));
            }
          }
        });
        return RestApi.getKnex().batchInsert("settlement", settlement_arr);
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("daily_cash", dailycash_arr);
      })
      .then((result) => {
        return Promise.all(query);
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
    const postUrl = `/settlement/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/settlement" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("settlement")
      .leftJoin("debt", "settlement.debt_id", "debt.id")
      .leftJoin("whole_diamond", "debt.wholediamond_id", "whole_diamond.id")
      .where("settlement.id", data.id)
      .select("settlement.id", "settlement.debt_id", "settlement.supplier_id", "settlement.wholediamond_id", "settlement.amount as pay_amount", "settlement.createddate", "debt.balance as amount", "whole_diamond.voc_no")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        result[0].amount += result[0].pay_amount;
        params.supplier_id = result[0].supplier_id;
        params.debt_array = Utils.mixin(data, result[0]);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/settlement-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const balance = data.amount - data.pay_amount;
    data.amount = data.pay_amount;
    data.updateddate = Utils.toSqlDate(new Date());
    let db = RestApi.getDb("settlement");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    delete (data.pay_amount);
    db.update(data, "id")
      .then((result) => {
        return RestApi.getDb("debt").where("id", data.debt_id).update({"balance": balance}, "id");
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
    RestApi.getDb("settlement")
      .where("id", data.id)
      .select()
      .then((result) => {
        return RestApi.getDb("debt").where("id", result[0].debt_id).increment("balance", result[0].amount);
      })
      .then((result) => {
        return RestApi.getDb("settlement").where({ id: data.id }).delete("id");
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

export default new SettlementRouter();