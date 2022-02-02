/**
 * Purchase Pt Routes
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

class PurchasePtRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/purchase-pt").all(Permission.onLoad).get(this.getList);
    this.route("/purchase-pt/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/purchase-pt/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/purchase-pt/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/purchase-pt", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/purchase-pt", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, postUrl: "/purchase-pt/entry", params: {}, listUrl: "/purchase-pt" };
    params = Permission.getMenuParams(params, req, res);
    params.params.cashier_name = req.user.username;
    params.params.cashier_id = req.user.id;
    const prefix = "PPT";
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
        delete (result[0].id);
        const voc_no = prefix + datecode + count;
        params.params.voc_no = voc_no;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");

        return RestApi.getDb("autogenerate").where("tablename", "purchase_pt_code").select();
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((pt) => {
            let count = 0;
            if (pt.lastdate == datecode) {
              count = pt.currentvalue;
            } else {
              pt.lastdate = datecode;
            }
            pt.count = count;
          });
        }
        params.params.codes = result;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");
        params.item_array = [];
        params.datecode = datecode;
        return RestApi.getDb("supplier").select("");
      })
      .then((result) => {
        const suppliers: any = [];
        let saleperson  = "";
        result.forEach((sup) => {
          saleperson = sup.sale_person + "(" + sup.supplier_name + ")";
          suppliers.push({ label: saleperson, value: sup.id });
        });
        params.suppliers = suppliers;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/purchase-pt-entry", params);
      })
      .catch((err) => {
        console.log("err ", err);
        res.render("dashboard/purchase-pt-entry", params);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const currentdate = Utils.toSqlDate(new Date());
    data.date = Utils.toSqlDate(data.date);
    data.isfinished = data.isfinished == "on" ? 1 : 0;
    data.paymenttype = "cash";
    const codes = JSON.parse(data.codes);
    const item_array = JSON.parse(data.item_array);
    const updatdate = currentdate;
    const datecode = Utils.toGeneratecodeDate(new Date());
    const item_arr: any = [];
    const code_arr: any = [];
    const query: any = [];
    let debt: any = {};
    const daily_cash: any = {};
    const daily_usage: any = {};
    const payment: any = {};
    data.id = uuid.v4();
    delete (data.cashier_name);
    if (data.paymenttype == "cash")
      data.debtprice = 0;
    else
      data.debtprice = data.total_price;

    if (data.paymenttype == "debt") {
      debt.id = uuid.v4();
      debt.date = currentdate;
      debt.supplier_id = data.supplier_id;
      debt.parent_id = data.id;
      debt.user_id = req.user.id;
      debt.currency = "MMK";
      debt.amount = data.total_price;
      debt.balance = data.total_price;
      debt.status = "purchase-pt";
      debt = comfunc.fillDefaultFields(debt);
      query.push(RestApi.getDb("debt").insert(debt, "id"));
      query.push(RestApi.getDb("supplier").where("id", data.supplier_id).increment("pay_mmk", data.total_price));
    } else {
      daily_cash.id = uuid.v4();
      daily_cash.date = currentdate;
      daily_cash.type_id = data.id;
      daily_cash.cash_out = data.total_price;
      daily_cash.status = "purchase";
      daily_cash.type = "purchase_pt";
      daily_cash.user_id = req.user.id;
      daily_cash.createddate = currentdate;
      daily_cash.updateddate = currentdate;
      query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));

      daily_usage.id = uuid.v4();
      daily_usage.date = currentdate;
      daily_usage.daily_cash_type_id = "db34c857-39a8-42fd-9a99-5befc6542995";
      daily_usage.title = "Purchase PT";
      daily_usage.total_amount = data.total_price;
      daily_usage.cash_amount = data.total_price;
      daily_usage.createddate = currentdate;
      daily_usage.updateddate = currentdate;
      query.push(RestApi.getDb("daily_usage").insert(daily_usage, "id"));

      payment.id = uuid.v4();
      payment.cash_id = daily_usage.id;
      payment.amount = data.total_price;
      payment.payment_type = "cash";
      payment.type = "usage";
      payment.createddate = currentdate;
      payment.updateddate = currentdate;
      query.push(RestApi.getDb("daily_cash_payment").insert(payment, "id"));
    }

    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.purchase_pt_id = data.id;
      item.current_qty = item.qty;
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
    });
    codes.forEach((code: any) => {
      if (code.lastdate == datecode)
        query.push(RestApi.getDb("autogenerate").where("prefix", code.prefix).update({ "currentvalue": code.count, "lastdate": datecode, "updateddate": updatdate }, "id"));
    });

    delete (data.codes);
    delete (data.item_array);
    delete (data.suppliers);
    delete (data.supplier);

    RestApi.getDb("purchase_pt").insert(data, "id")
      .then((result) => {
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        const prefix = "PPT";
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
        return RestApi.getKnex().batchInsert("purchase_pt_items", item_arr);
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
    const postUrl = `/purchase-pt/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/purchase-pt" };
    params = Permission.getMenuParams(params, req, res);
    const datecode = Utils.toGeneratecodeDate(new Date());

    RestApi.getDb("purchase_pt")
      .leftJoin("user", "purchase_pt.cashier_id", "user.id")
      .leftJoin("supplier", "supplier_id", "supplier.id")
      .where({ "purchase_pt.id": data.id })
      .select("purchase_pt.*", "user.username as cashier_name", "supplier.supplier_name", "supplier.sale_person")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        if (params.params.cashier_id == "0") {
          params.params.cashier_name = "admin";
        }
        params.params.supplier = params.params.sale_person + "(" + params.params.supplier_name + ")";
        return RestApi.getDb("purchase_pt_items").where("purchase_pt_id", data.id).leftJoin("category", "purchase_pt_items.category_id", "category.id").select("purchase_pt_items.*", "category.category_name as category");
      })
      .then((result) => {
        params.item_array = result;
        return RestApi.getDb("supplier").select("");
      })
      .then((result) => {
        const suppliers: any = [];
        let saleperson = "";
        result.forEach((sup) => {
          saleperson = sup.sale_person + "(" + sup.supplier_name + ")";
          suppliers.push({ label: saleperson, value: sup.id });
        });
        params.suppliers = suppliers;
        return RestApi.getDb("autogenerate").where("tablename", "purchase_pt_code").select();
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((pt) => {
            let count = 0;
            if (pt.lastdate == datecode) {
              count = pt.currentvalue;
            } else {
              pt.lastdate = datecode;
            }
            pt.count = count;
          });
        }
        params.params.codes = result;
        params.datecode = datecode;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/purchase-pt-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const currentdate = Utils.toSqlDate(new Date());
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    data.date = Utils.toSqlDate(data.date);
    data.updateddate = currentdate;
    data.paymenttype = "cash";
    if (data.isfinished == "on" || data.isfinished == "1") {
      data.isfinished = 1;
    }
    else {
      data.isfinished = 0;
    }
    const items = JSON.parse(data.item_array);
    const codes = JSON.parse(data.codes);
    const updatdate = currentdate;
    const datecode = Utils.toGeneratecodeDate(new Date());
    const item_arr: any = [];
    const code_arr: any = [];
    const query: any = [];
    let debt: any = {};
    const daily_cash: any = {};
    const daily_usage: any = {};
    const payment: any = {};
    if (data.paymenttype == "cash")
      data.debtprice = 0;
    else
      data.debtprice = data.total_price;

    items.forEach((item: any) => {
      if (item.id && item.id != "") {
        delete item.category;
      } else {
        item.id = uuid.v4();
        item.purchase_pt_id = data.id;
      }
      item.current_qty = item.qty;
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
    });

    delete (data.codes);
    delete (data.item_array);
    delete (data.suppliers);
    delete (data.supplier);
    delete (data.cashier_name);

    codes.forEach((code: any) => {
      if (code.lastdate == datecode)
        query.push(RestApi.getDb("autogenerate").where("prefix", code.prefix).update({ "currentvalue": code.count, "lastdate": datecode, "updateddate": updatdate }, "id"));
    });

    let db = RestApi.getDb("purchase_pt");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });

    RestApi.getDb("purchase_pt")
      .where("id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
          if (result[0].paymenttype == "debt") {
            query.push(RestApi.getDb("debt").where({ "parent_id": data.id, "status": "purchase-pt" }).delete());
            query.push(RestApi.getDb("supplier").where("id", result[0].supplier_id).decrement("pay_mmk", result[0].total_price));
          } else {
            query.push(RestApi.getDb("daily_cash").where({ "type_id": data.id, "type": "purchase_pt" }).delete());
          }
        }
        if (data.paymenttype == "debt") {
          debt.id = uuid.v4();
          debt.date = currentdate;
          debt.supplier_id = data.supplier_id;
          debt.parent_id = data.id;
          debt.user_id = req.user.id;
          debt.currency = "MMK";
          debt.amount = data.total_price;
          debt.balance = data.total_price;
          debt.status = "purchase-pt";
          debt = comfunc.fillDefaultFields(debt);
          query.push(RestApi.getDb("debt").insert(debt, "id"));
          query.push(RestApi.getDb("supplier").where("id", data.supplier_id).increment("pay_mmk", data.total_price));
        } else {
          daily_cash.id = uuid.v4();
          daily_cash.date = currentdate;
          daily_cash.type_id = data.id;
          daily_cash.cash_out = data.total_price;
          daily_cash.status = "purchase";
          daily_cash.type = "purchase_pt";
          daily_cash.user_id = req.user.id;
          daily_cash.createddate = currentdate;
          daily_cash.updateddate = currentdate;
          query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));

          daily_usage.id = uuid.v4();
          daily_usage.date = currentdate;
          daily_usage.daily_cash_type_id = "db34c857-39a8-42fd-9a99-5befc6542995";
          daily_usage.title = "Purchase PT";
          daily_usage.total_amount = data.total_price;
          daily_usage.cash_amount = data.total_price;
          daily_usage.createddate = currentdate;
          daily_usage.updateddate = currentdate;
          query.push(RestApi.getDb("daily_usage").insert(daily_usage, "id"));

          payment.id = uuid.v4();
          payment.cash_id = daily_usage.id;
          payment.amount = data.total_price;
          payment.payment_type = "cash";
          payment.type = "usage";
          payment.createddate = currentdate;
          payment.updateddate = currentdate;
          query.push(RestApi.getDb("daily_cash_payment").insert(payment, "id"));
        }
        return db.update(data, "id");
      })
      .then((result) => {
        return RestApi.getDb("purchase_pt_items").where("purchase_pt_id", data.id).delete();
      })
      .then((result) => {
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return data;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("purchase_pt_items", item_arr);
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

    RestApi.getKnex().raw(`SELECT * FROM divide_pt
      WHERE purchase_pt_items_id IN (
        SELECT id FROM purchase_pt_items
        WHERE purchase_pt_id = '` + data.id + `'
      )`)
      .then((result) => {
        if (result[0].length > 0) {
          throw new Error("Can not Delete. Already Used.");
        } else {
          return RestApi.getDb("purchase_pt").where("id", data.id).select();
        }
      })
      .then((result) => {
        if (result.length > 0) {
          if (result[0].paymenttype == "cash") {
            query.push(RestApi.getDb("daily_cash").where({ "type_id": data.id, "type": "purchase_pt" }).delete());
          } else {
            query.push(RestApi.getDb("debt").where({ "parent_id": data.id, "status": "purchase-pt" }).delete());
            query.push(RestApi.getDb("supplier").where("id", result[0].supplier_id).decrement("pay_mmk", result[0].total_price));
          }
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("purchase_pt_items").where({ purchase_pt_id: data.id }).delete("id");
      })
      .then((result) => {
        return RestApi.getDb("purchase_pt").where({ id: data.id }).delete("id");
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

export default new PurchasePtRouter();