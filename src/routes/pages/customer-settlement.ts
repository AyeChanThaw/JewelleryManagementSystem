/**
 * Customer Settlement Routes
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

class CustomerSettlementRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/customer-settlement").all(Permission.onLoad).get(this.getList);
    this.route("/customer-settlement/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/customer-settlement/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/customer-settlement/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/customer-debt").all(Permission.onLoad).get(this.getCustomerDebt);
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
          res.render("dashboard/customer-settlement", params);
        })
        .catch((err: any) => {
          console.log("er : ", err);
          next(err);
        });

    } else {
      res.render("dashboard/customer-settlement", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/customer-settlement/entry", params: {}, listUrl: "/customer-settlement" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.debt_array = [];
          res.render("dashboard/customer-settlement-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer-settlement-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    const customer_debt_id = data.customer_debt_id;
    const pay_amount = data.pay_amount;
    const voc_no = data.voc_no;
    const settlement_arr: any = [];
    const dailycash_arr: any = [];
    const dailycashin_arr: any = [];
    const payment_arr: any = [];
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    RestApi.getKnex().raw(`SELECT customer_debt.*, IF(sale_diamond_id = '', sale_gold.voc_no, sale_diamond.voc_no) AS voc_no
        FROM customer_debt
        LEFT JOIN customer ON customer_id = customer.id
        LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
        LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
        WHERE customer_debt.customer_id = '` + data.customer_id + `'`)
        .then((result) => {
            result[0].forEach((debt: any) => {
            if (typeof voc_no == "object") {
              voc_no.forEach((item: any, index: number) => {
                if (debt.voc_no == item && pay_amount[index] > 0) {
                  const settlement: any = {
                      id: uuid.v4(),
                      date: Utils.toSqlDate(new Date()),
                      user_id: req.user.id,
                      customer_id: data.customer_id,
                      customer_debt_id: customer_debt_id[index],
                      // sale_diamond_id: sale_diamond_id[index],
                      // sale_gold_id: sale_gold_id[index],
                      amount: pay_amount[index],
                      createddate: date,
                      updateddate: date
                  };
                  settlement_arr.push(settlement);
                  query.push(RestApi.getDb("customer_debt").where("id", customer_debt_id[index]).decrement("balance", pay_amount[index]).update({"updateddate": date }));
                  const daily_cash: any = {
                    id: uuid.v4(),
                    date: date,
                    type_id: settlement.id,
                    cash_in: settlement.amount,
                    status: "sale",
                    type: "customer_settlement",
                    user_id: req.user.id,
                    createddate: date,
                    updateddate: date
                  };
                  dailycash_arr.push(daily_cash);
                  let daily_cashin: any = {
                    id: uuid.v4(),
                    date: date,
                    daily_cash_in_type_id: "5056908a-7b95-4b1b-968e-23694fbe531d",
                    title: "Diamond Sale",
                    total_amount: settlement.amount,
                    cash_amount: settlement.amount,
                    type_id: settlement.id,
                    status: "customer_settlement",
                    createddate: date,
                    updateddate: date
                  }
                  dailycashin_arr.push(daily_cashin);
                  let payment: any = {
                    id: uuid.v4(),
                    cash_id: settlement.id,
                    amount: settlement.amount,
                    payment_type: "cash",
                    type: "cash_in_showroom",
                    createddate: date,
                    updateddate: date
                  }
                  payment_arr.push(payment);
                }
              });
            } else {
              if (debt.voc_no == voc_no && pay_amount > 0) {
                const settlement: any = {
                    id: uuid.v4(),
                    date: date,
                    user_id: req.user.id,
                    customer_id: data.customer_id,
                    customer_debt_id: customer_debt_id,
                    // sale_diamond_id: sale_diamond_id,
                    // sale_gold_id: sale_gold_id,
                    amount: pay_amount,
                    createddate: date,
                    updateddate: date
                };
                settlement_arr.push(settlement);
                query.push(RestApi.getDb("customer_debt").where("id", customer_debt_id).decrement("balance", pay_amount).update({"updateddate": date }));
                const daily_cash: any = {
                    id: uuid.v4(),
                    date: date,
                    type_id: settlement.id,
                    cash_in: settlement.amount,
                    status: "sale",
                    type: "customer_settlement",
                    user_id: req.user.id,
                    createddate: Utils.toSqlDate(new Date()),
                    updateddate: Utils.toSqlDate(new Date())
                };
                dailycash_arr.push(daily_cash);
                let daily_cashin: any = {
                  id: uuid.v4(),
                  date: date,
                  daily_cash_in_type_id: "5056908a-7b95-4b1b-968e-23694fbe531d",
                  title: "Diamond Sale",
                  total_amount: settlement.amount,
                  cash_amount: settlement.amount,
                  type_id: settlement.id,
                  status: "customer_settlement",
                  createddate: date,
                  updateddate: date
                }
                dailycashin_arr.push(daily_cashin);
                let payment: any = {
                  id: uuid.v4(),
                  cash_id: settlement.id,
                  amount: settlement.amount,
                  payment_type: "cash",
                  type: "cash_in_showroom",
                  createddate: date,
                  updateddate: date
                }
                payment_arr.push(payment);
                }
              }
            });
            query.push(RestApi.getKnex().batchInsert("daily_cash_showroom", dailycash_arr));
            query.push(RestApi.getKnex().batchInsert("daily_cash_in_showroom", dailycashin_arr));
            query.push(RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr))
            return Promise.all(query);
        })
        .then((result) => {
            return RestApi.getKnex().batchInsert("customer_settlement", settlement_arr);
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
    const postUrl = `/customer-settlement/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/customer-settlement" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getKnex().raw(`SELECT customer_settlement.id, customer_settlement.customer_debt_id, customer_settlement.customer_id, customer_settlement.amount as pay_amount, customer_settlement.createddate, customer_debt.balance as amount, IF(customer_debt.sale_diamond_id = '', sale_gold.voc_no, sale_diamond.voc_no) AS voc_no
        FROM customer_settlement
        LEFT JOIN customer_debt ON customer_debt_id = customer_debt.id
        LEFT JOIN sale_diamond ON customer_debt.sale_diamond_id = sale_diamond.id
        LEFT JOIN sale_gold ON customer_debt.sale_gold_id = sale_gold.id
        WHERE customer_settlement.id = '` + data.id + `'
        ORDER BY customer_settlement.date DESC`)
    // RestApi.getDb("customer_settlement")
    //   .leftJoin("customer_debt", "customer_debt_id", "customer_debt.id")
    //   .leftJoin("sale_diamond", "sale_diamond_id", "sale_diamond.id")
    //   .where("customer_settlement.id", data.id)
    //   .select("customer_settlement.id", "customer_settlement.customer_debt_id", "customer_settlement.customer_id", "customer_settlement.amount as pay_amount", "customer_settlement.createddate", "customer_debt.balance as amount", "whole_diamond.voc_no")
      .then((result) => {
        params.params = Utils.mixin(data, result[0][0]);
        result[0][0].amount += result[0][0].pay_amount;
        params.customer_id = result[0][0].customer_id;
        params.customer_debt_array = Utils.mixin(data, result[0][0]);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/customer-settlement-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const balance = data.amount - data.pay_amount;
    const amount = data.pay_amount;
    const date = Utils.toSqlDate(new Date());
    const query: any = [];
    data.amount = data.pay_amount;
    data.updateddate = date;
    let db = RestApi.getDb("customer_settlement");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.pay_amount);
    RestApi.getDb("customer_settlement")
      .where("id", data.id)
      .select()
      .then((result) => {
        query.push(RestApi.getDb("customer_debt").where("id", data.customer_debt_id).update({"balance": balance, "updateddate": date}, "id"));
        query.push(RestApi.getDb("daily_cash_showroom").where("type_id", data.id).update({"cash_in": amount, "updateddate": date}, "id"));
        query.push(RestApi.getDb("daily_cash_in_showroom").where("type_id", data.id).update({"total": amount, "cash_amount": amount, "updateddate": date}, "id"));
        query.push(RestApi.getDb("daily_cash_payment").where("cash_id", data.id).update({"amount": amount, "updateddate": date}, "id"));
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
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("customer_settlement")
      .where("id", data.id)
      .select()
      .then((result) => {
        return RestApi.getDb("customer_debt").where("id", result[0].customer_debt_id).increment("balance", result[0].amount);
      })
      .then((result) => {
        return RestApi.getDb("daily_cash_showroom").where("type_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getDb("customer_settlement").where({ id: data.id }).delete("id");
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

  public getCustomerDebt(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/customer-debt", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer-debt", params);
    }
  }
}

export default new CustomerSettlementRouter();