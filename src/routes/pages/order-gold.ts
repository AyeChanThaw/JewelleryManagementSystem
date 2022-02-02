/**
 * Order Gold
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

class OrderGoldRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/order-gold").all(Permission.onLoad).get(this.getList);
    this.route("/order-gold/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/order-gold/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/order-gold/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/order-gold/preview/:id").all(Permission.onLoad).get(this.getDetail);
    this.route("/order-gold-delete").all(Permission.onLoad).get(this.getDeleteList);
    this.route("/order-gold-delete/recover/:id").all(Permission.onLoad).post(this.postRecover);
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
          res.render("dashboard/order-gold", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-gold", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/order-gold/entry", params: {}, listUrl: "/order-gold" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "ORG";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("customer")
      .select()
      .then((result) => {
        const customers: any = [];
        const name = "";
        result.forEach((cus) => {
          customers.push({label: cus.code, value: cus.id});
        });
        params.params.customers = customers;

        return RestApi.getDb("autogenerate").where("prefix", prefix).select();
      })
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        const code = prefix + datecode + count;
        params.params.voc_no = code;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");
        params.payment_array = [];
        res.render("dashboard/order-gold-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.duedate = Utils.toSqlDate(data.duedate);
    data.is_active = 1;
    data.id = uuid.v4();
    data.total_amount = Utils.removeComma(data.total_amount);
    data.cash_amount = 0;
    data.bank_amount = 0;
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    const query: any = [];
    const customer_name = data.customer_name;
    const phone = data.phone;
    const date = Utils.toSqlDate(new Date());
    payment_array.forEach((payment: any) => {
      payment.id = uuid.v4();
      payment.order_id = data.id;
      payment.type = "order_gold";
      delete payment.account;
      if (payment.payment_type == "bank") {
        data.bank_amount += Number(payment.amount);
      } else {
        data.cash_amount += Number(payment.amount);
      }
      payment = comfunc.fillDefaultFields(payment);
      payment_arr.push(payment);

      let cash_payment: any = {
        id: uuid.v4(),
        cash_id: data.id,
        bank_id: payment.bank_id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        type: "cash_in_showroom"
      }
      cash_payment = comfunc.fillDefaultFields(cash_payment);
      query.push(RestApi.getDb("daily_cash_payment").insert(cash_payment, "id"));
    });
    delete (data.payment_array);
    delete (data.customers);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    let daily_cash: any = {
      id: uuid.v4(),
      date: Utils.toSqlDate(new Date()),
      type_id: data.id,
      cash_in: data.total_amount,
      status: "sale",
      type: "order_gold",
      user_id: req.user.id,
      sale_person_id: data.sale_person_id
    };
    daily_cash = comfunc.fillDefaultFields(daily_cash);
    query.push(RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id"));
    let cash_in: any = {
      id: uuid.v4(),
      date: date,
      daily_cash_in_type_id: "c30c63d1-a426-49e6-857c-10ca4968d468",
      title: "Gold Sale",
      total_amount: data.total_amount,
      bank_amount: data.bank_amount,
      cash_amount: data.cash_amount,
      type_id: data.id,
      status: "order_gold"
    }
    cash_in = comfunc.fillDefaultFields(cash_in);
    query.push(RestApi.getDb("daily_cash_in_showroom").insert(cash_in, "id"));
    RestApi.getDb("autogenerate").select("*").where("prefix", "ORG")
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
        delete (result[0].id);

        if (result[0].lastdate == datecode) {
          return RestApi.getDb("autogenerate").where("prefix", "ORG").update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id") as PromiseLike<any>;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("order_payment", payment_array);
      })
      .then((result) => {
        return RestApi.getDb("order_gold").insert(data, "id");
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
    const postUrl = `/order-gold/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/order-gold" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("order_gold")
      .leftJoin("customer", "customer_id", "customer.id")
      .where({ "order_gold.id": data.id })
      .select("order_gold.*", "customer.code as customer_code", "customer.customer_name", "customer.phone")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].duedate = Utils.toDisplayDate(result[0].duedate);
        result[0].total_amount = Utils.addComma(result[0].total_amount);
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("order_payment").leftJoin("bank", "bank_id", "bank.id").where({"order_id": data.id, "type": "order_gold"}).select("order_payment.*", "bank.bank_name", "bank.account");
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((payment) => {
            payment.amount = Utils.addComma(payment.amount);
          })
        }
        params.payment_array = result;
        return RestApi.getDb("customer").select();
      })
      .then((result) => {
        const customers: any = [];
        let name = "";
        result.forEach((cus) => {
          name = cus.customer_name + " (" + cus.phone + ")";
          customers.push({label: name, value: cus.id});
        });
        params.params.customers = customers;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/order-gold-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.duedate = Utils.toSqlDate(data.duedate);
    data.total_amount = Utils.removeComma(data.total_amount);
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    const query: any = [];
    const customer_name = data.customer_name;
    const phone = data.phone;
    const date = Utils.toSqlDate(new Date);
    query.push(RestApi.getDb("daily_cash_payment").where({"cash_id": data.id, "type": "cash_in_showroom"}).delete());
    query.push(RestApi.getDb("daily_cash_in_showroom").where({"type_id": data.id, "status": "order_gold"}).delete());
    payment_array.forEach((payment: any) => {
      if (payment.id && payment.id != "") {
        payment.createddate = date;
        payment.updateddate = date;
        payment.amount = Utils.removeComma(payment.amount);
        delete payment.account;
        delete payment.bank_name;
      } else {
        payment.id = uuid.v4();
        delete payment.account;
        payment = comfunc.fillDefaultFields(payment);
        payment.order_id = data.id;
      }
      if (payment.payment_type == "bank") {
        data.bank_amount += Number(payment.amount);
      } else {
        data.cash_amount += Number(payment.amount);
      }
      payment.type = "order_gold";
      payment_arr.push(payment);
      let cash_payment: any = {
        id: uuid.v4(),
        cash_id: data.id,
        bank_id: payment.bank_id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        type: "cash_in_showroom"
      }
      cash_payment = comfunc.fillDefaultFields(cash_payment);
      query.push(RestApi.getDb("daily_cash_payment").insert(cash_payment, "id"));
    });
    let cash_in: any = {
      id: uuid.v4(),
      date: date,
      daily_cash_in_type_id: "c30c63d1-a426-49e6-857c-10ca4968d468",
      title: "Gold Sale",
      total_amount: data.total_amount,
      bank_amount: data.bank_amount,
      cash_amount: data.cash_amount,
      type_id: data.id,
      status: "order_gold"
    }
    cash_in = comfunc.fillDefaultFields(cash_in);
    query.push(RestApi.getDb("daily_cash_in_showroom").insert(cash_in, "id"));
    query.push(RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "type": "order_gold"}).update({"cash_in": data.total_amount, "updateddate": date}));
    delete (data.payment_array);
    delete (data.customers);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    let db = RestApi.getDb("order_gold");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getDb("order_payment")
      .where("order_id", data.id)
      .delete()
      .then((result) => {
        return db.update(data, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("order_payment", payment_arr);
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

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const sale_gold: any = [];
    const query: any = [];
    const user_id: any = req.user.id;
    query.push(RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "type": "order_gold"}).delete());
    query.push(RestApi.getDb("daily_cash_in_showroom").where({"type_id": data.id, "type": "order_gold"}).delete());
    query.push(RestApi.getDb("daily_cash_payment").where({"cash_id": data.id, "type": "cash_in_showroom"}).delete());
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("order_payment")
      .where("order_id", data.id)
      .update({ "is_delete": 1 })
      .then((result) => {
        return Promise.all(query);
      })
      .then((result) => {
        return RestApi.getDb("order_gold").where({ id: data.id }).update({ "is_active": 0, "is_delete": 1, "deleted_user_id": user_id, "deleted_date": Utils.toSqlDate(new Date()) });
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getDeleteList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/order-gold-delete", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-gold-delete", params);
    }
  }

  public postRecover(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    let sale_gold: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    const user_id: any = req.user.id;
    const date = Utils.toSqlDate(new Date());

    RestApi.getDb("order_gold")
      .where("id", data.id)
      .select()
      .then((result) => {
        let daily_cash: any = {
          id: uuid.v4(),
          date: date,
          type_id: data.id,
          cash_in: result[0].total_amount,
          status: "sale",
          type: "order_gold",
          user_id: user_id,
          sale_person_id: result[0].sale_person_id
        };
        daily_cash = comfunc.fillDefaultFields(daily_cash);
        return RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id");
      })
      .then((result) => {
        return RestApi.getDb("order_payment").where({"order_id": data.id, "type": "order_gold"}).update({ "is_delete": 0 });
      })
      .then((result) => {
        return RestApi.getDb("order_gold").where("id", data.id).update({ "is_active": 1, "is_delete": 0, "recover_user_id": user_id, "recover_date": Utils.toSqlDate(new Date()) });
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const id = data.id;

    if (Utils.isEmpty(id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/order-gold/preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("order_gold")
      .leftJoin("customer", "order_gold.customer_id", "customer.id")
      .leftJoin("sale_person", "order_gold.sale_person_id", "sale_person.id")
      .where({ "order_gold.id": data.id })
      .select("order_gold.*", "customer.code as customer_code", "customer.customer_name", "customer.phone", "sale_person.sale_person_name")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].print_date = Utils.toDisplayDate(new Date());
        if (result[0].goldrate == "a")
            result[0].goldrate = "၁၆ ပဲရည်";
        else if (result[0].goldrate == "b")
            result[0].goldrate = "၁၅ ပဲရည်";
        else if (result[0].goldrate == "c")
            result[0].goldrate = "၁၄ ပဲရည်";
        else if (result[0].goldrate == "d")
            result[0].goldrate = "၁၃ ပဲရည်";
        params.params = Utils.mixin(data, result[0]);
        // Thousand Separator
        params.params.total_amount = Utils.numberWithCommas(params.params.total_amount);

        return RestApi.getDb("order_payment").leftJoin("bank", "bank_id", "bank.id").where({ "order_id": data.id, "type": "order_gold" }).select("order_payment.*", "bank.bank_name", "bank.account")
      })
      .then((result) => {
        const payment_arr: any = [];
        if (result.length > 0) {
          result.forEach((item) => {
            if (item.payment_type == "bank") {
              payment_arr.push({payment: item.bank_name + " (" + item.account + ")", amount: Utils.numberWithCommas(item.amount)});
            } else {
              payment_arr.push({payment: "Cash", amount: Utils.numberWithCommas(item.amount)});
            }
          });
        }
        params.payment_array = payment_arr;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/order-gold-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }
}

export default new OrderGoldRouter();