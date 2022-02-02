/**
 * Return Outside Diamond
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

class ReturnOutsideDiamondRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/return-outside-diamond").all(Permission.onLoad).get(this.getList);
    this.route("/return-outside-diamond/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/return-outside-diamond/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/return-outside-diamond/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/return-outside-diamond/preview/:id").all(Permission.onLoad).get(this.getDetail);
    this.route("/return-outside-diamond-delete").all(Permission.onLoad).get(this.getDeleteList);
    this.route("/return-outside-diamond-delete/recover/:id").all(Permission.onLoad).post(this.postRecover);
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
          res.render("dashboard/return-outside-diamond", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-outside-diamond", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/return-outside-diamond/entry", params: {}, listUrl: "/return-outside-diamond" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "RTOD";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("customer")
      .select()
      .then((result) => {
        const customers: any = [];
        result.forEach((cus) => {
          customers.push({label: cus.code, value: cus.id});
        });
        params.customers = customers;
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
        params.item_array = [];
        res.render("dashboard/return-outside-diamond-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.total_amount = Utils.removeComma(data.total_amount);
    data.subtotal = Utils.removeComma(data.subtotal);
    data.profit_amount = data.profit_amount > 0 ? Utils.removeComma(data.profit_amount) : 0;
    data.discount_amount = data.discount_amount > 0 ? data.discount_amount : 0;
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    const return_items: any = [];
    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.return_outside_diamond_id = data.id;
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
    });
    delete (data.item_array);
    delete (data.customers);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    RestApi.getDb("autogenerate").select("*").where("prefix", "RTOD")
      .then((result) => {
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
        // if (result[0].lastdate == datecode) {
        return RestApi.getDb("autogenerate").where("prefix", "RTOD").update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id") as PromiseLike<any>;
        // }
      })
      .then((result) => {
        return RestApi.getDb("autogenerate").where("prefix", "RTI").select("*");
      })
      .then((result) => {
        let item_count = 0;
        let item_code = "";
        const prefix = "RTI";
        if (result[0].lastdate == datecode) {
          item_count = result[0].currentvalue;
        } else {
          result[0].lastdate = datecode;
        }
        item_arr.forEach((item: any) => {
          item_count++;
          item_code = prefix + datecode + item_count;
          let return_i: any = {
            id: uuid.v4(),
            date: date,
            code: item_code,
            return_outside_diamond_item_id: item.id,
            wgt_gm: item.wgt_gm,
            wgt_k: 0,
            wgt_p: 0,
            wgt_y: 0,
            category_id: item.category_id,
            diamond_qty: item.diamond_qty,
            price: item.price,
            type: "diamond"
          };
          return_i = comfunc.fillDefaultFields(return_i);
          return_items.push(return_i);
        });
        query.push(RestApi.getKnex().batchInsert("return_items", return_items));
        query.push(RestApi.getDb("autogenerate").where("prefix", "RTI").update({ "currentvalue": item_count, "lastdate": datecode, "updateddate": date }, "id"));
        // if (result[0].lastdate == datecode) {
        //   return RestApi.getDb("autogenerate").where("prefix", "RTI").update({ "currentvalue": item_count, "lastdate": datecode, "updateddate": date }, "id") as PromiseLike<any>;
        // }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        let daily_cash: any = {
          id: uuid.v4(),
          date: Utils.toSqlDate(new Date()),
          type_id: data.id,
          cash_out: data.subtotal,
          status: "return",
          type: "return_outside_diamond",
          user_id: req.user.id,
          sale_person_id: data.sale_person_id
        };
        daily_cash = comfunc.fillDefaultFields(daily_cash);
        return RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id");
      })
      .then((result) => {
        return RestApi.getDb("return_outside_diamond").insert(data, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("return_outside_diamond_items", item_arr);
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
    const postUrl = `/return-outside-diamond/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/return-outside-diamond" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("return_outside_diamond")
      .leftJoin("customer", "customer_id", "customer.id")
      .where({ "return_outside_diamond.id": data.id })
      .select("return_outside_diamond.*", "customer.code as customer_code", "customer.customer_name", "customer.phone")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].total_amount = Utils.addComma(result[0].total_amount);
        result[0].subtotal = Utils.addComma(result[0].subtotal);
        result[0].profit_amount = Utils.addComma(result[0].profit_amount);
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("return_outside_diamond_items").leftJoin("category", "category_id", "category.id").where("return_outside_diamond_id", data.id).select("return_outside_diamond_items.*", "category_name");
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            item.price = Utils.addComma(item.price);
          });
        }
        params.item_array = result;
        return RestApi.getDb("customer").select();
      })
      .then((result) => {
        const customers: any = [];
        let name = "";
        result.forEach((cus) => {
          name = cus.customer_name + " (" + cus.phone + ")";
          customers.push({label: name, value: cus.id});
        });
        params.customers = customers;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/return-outside-diamond-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.total_amount = Utils.removeComma(data.total_amount);
    data.subtotal = Utils.removeComma(data.subtotal);
    data.profit_amount = Utils.removeComma(data.profit_amount);
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const query: any = [];
    const return_items: any = [];
    const date = Utils.toSqlDate(new Date);
    const datecode = Utils.toGeneratecodeDate(new Date());
    delete (data.item_array);
    delete (data.customers);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    let db = RestApi.getDb("return_outside_diamond");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getDb("return_outside_diamond")
      .leftJoin("return_outside_diamond_items", "return_outside_diamond_id", "return_outside_diamond.id")
      .where("return_outside_diamond_id", data.id)
      .select("return_outside_diamond_items.id")
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            let isExist = 0;
            item_array.forEach((new_item: any) => {
              if (new_item.id == item.id)
                isExist = 1;
            });
            if (isExist == 0) {
              query.push(RestApi.getDb("return_items").where("return_outside_diamond_item_id", item.id).delete());
            }
          });
        }
        return RestApi.getDb("autogenerate").where("prefix", "RTI").select("*");
      })
      .then((result) => {
        let item_count = 0;
        let item_code = "";
        const prefix = "RTI";
        if (result[0].lastdate == datecode) {
          item_count = result[0].currentvalue;
        } else {
          result[0].lastdate = datecode;
        }

        item_array.forEach((item: any) => {
          if (item.id && item.id != "") {
            item.updateddate = date;
            item.price = Utils.removeComma(item.price);
            delete item.item_name;
            delete item.category_name;
          } else {
            item.id = uuid.v4();
            item.return_outside_diamond_id = data.id;

            // return item
            item_count++;
            item_code = prefix + datecode + item_count;
            let return_i: any = {
              id: uuid.v4(),
              date: date,
              code: item_code,
              return_outside_diamond_item_id: item.id,
              wgt_gm: item.wgt_gm,
              wgt_k: 0,
              wgt_p: 0,
              wgt_y: 0,
              category_id: item.category_id,
              diamond_qty: item.diamond_qty,
              price: item.price,
              type: "diamond"
            };
            return_i = comfunc.fillDefaultFields(return_i);
            return_items.push(return_i);
          }
          item = comfunc.fillDefaultFields(item);
          item_arr.push(item);
        });
        if (return_items.length > 0) {
          query.push(RestApi.getKnex().batchInsert("return_items", return_items));
          query.push(RestApi.getDb("autogenerate").where("prefix", "RTI").update({ "currentvalue": item_count, "lastdate": datecode, "updateddate": date }, "id"));
        }
        query.push(RestApi.getDb("daily_cash_showroom").where({"type": "return_outside_diamond", "type_id": data.id}).update({"cash_out": data.subtotal, "updateddate": date}));
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return db.update(data, "id");
      })
      .then((result) => {
        return RestApi.getDb("return_outside_diamond_items").where("return_outside_diamond_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("return_outside_diamond_items", item_arr);
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
    const user_id: any = req.user.id;
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_outside_diamond")
      .leftJoin("return_outside_diamond_items", "return_outside_diamond.id", "return_outside_diamond_id")
      .where("return_outside_diamond.id", data.id)
      .select("return_outside_diamond.*", "return_outside_diamond_items.id as return_outside_diamond_item_id", "return_outside_diamond_items.price")
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            query.push(RestApi.getDb("return_items").where("return_outside_diamond_item_id", item.return_outside_diamond_item_id).update({"is_active": 0, "is_delete": 1}));
          });
          query.push(RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "type": "return_outside_diamond"}).delete());
          if (query.length > 0) {
            return Promise.all(query);
          } else {
            return undefined;
          }
        }
      })
      .then((result) => {
        return RestApi.getDb("return_outside_diamond_items").where("return_outside_diamond_id", data.id).update({"is_delete": 1});
      })
      .then((result) => {
        return RestApi.getDb("return_outside_diamond").where({ id: data.id }).update({ "is_active": 0, "is_delete": 1, "deleted_user_id": user_id, "deleted_date": Utils.toSqlDate(new Date()) });
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
          res.render("dashboard/return-outside-diamond-delete", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-outside-diamond-delete", params);
    }
  }

  public postRecover(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const item_arr: any = [];
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    const user_id: any = req.user.id;
    const date = Utils.toSqlDate(new Date());
    let total_amt: any = 0;

    RestApi.getDb("return_outside_diamond_items")
      .where("return_outside_diamond_id", data.id)
      .select()
      .then((result) => {
        result.forEach((item) => {
          total_amt += item.price;
          item_arr.push(item.item_id);
          query.push(RestApi.getDb("return_items").where("return_outside_diamond_item_id", item.id).update({"is_active": 1, "is_delete": 0}));
        });
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        let daily_cash: any = {
          id: uuid.v4(),
          date: date,
          type_id: data.id,
          cash_out: total_amt,
          status: "return",
          type: "return_outside_diamond",
          user_id: user_id,
        };
        daily_cash = comfunc.fillDefaultFields(daily_cash);
        return RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id");
      })
      .then((result) => {
        return RestApi.getDb("return_outside_diamond_items").where("return_outside_diamond_id", data.id).update({ "is_delete": 0 });
      })
      .then((result) => {
        return RestApi.getDb("return_outside_diamond").where("id", data.id).update({ "is_active": 1, "is_delete": 0, "recover_user_id": user_id, "recover_date": Utils.toSqlDate(new Date()) });
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
    const postUrl = `/return-outside-diamond/preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("return_outside_diamond")
      .leftJoin("customer", "return_outside_diamond.customer_id", "customer.id")
      .leftJoin("sale_person", "return_outside_diamond.sale_person_id", "sale_person.id")
      .where({ "return_outside_diamond.id": data.id })
      .select("return_outside_diamond.*", "customer.code as customer_code", "customer.customer_name", "customer.phone", "sale_person.sale_person_name")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].print_date = Utils.toDisplayDate(new Date());
        // Thousand Separator
        result[0].total_amount = Utils.numberWithCommas(result[0].total_amount);
        result[0].profit_amount = Utils.numberWithCommas(result[0].profit_amount);
        result[0].discount_amount = Utils.numberWithCommas(result[0].discount_amount);
        result[0].subtotal = Utils.numberWithCommas(result[0].subtotal);
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("return_outside_diamond_items")
          .leftJoin("category", "category_id", "category.id")
          .where({ "return_outside_diamond_id": data.id })
          .select("return_outside_diamond_items.*", "category_name");
      })
      .then((result) => {
        if (result.length > 0) {
          // Thousand Separator
          result.forEach((item) => {
            item.price = Utils.numberWithCommas(item.price);
          });
        }
        params.item_array = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/return-outside-diamond-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }
}

export default new ReturnOutsideDiamondRouter();