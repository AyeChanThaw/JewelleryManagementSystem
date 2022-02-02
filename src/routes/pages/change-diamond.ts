/**
 * Change Diamond
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

class ChangeDiamondRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/change-diamond").all(Permission.onLoad).get(this.getList);
    this.route("/change-diamond/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/change-diamond/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/change-diamond/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/change-diamond/preview/:id").all(Permission.onLoad).get(this.getDetail);
    this.route("/change-diamond-delete").all(Permission.onLoad).get(this.getDeleteList);
    this.route("/change-diamond-delete/recover/:id").all(Permission.onLoad).post(this.postRecover);
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
          res.render("dashboard/change-diamond", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/change-diamond", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/change-diamond/entry", params: {}, listUrl: "/change-diamond" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "CHD";
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
        res.render("dashboard/change-diamond-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.change_diamond_id = data.id;
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
      query.push(RestApi.getDb("sale_diamond_items").where("item_id", item.item_id).update({"status": "change", "updateddate": Utils.toSqlDate(new Date())}));
      query.push(RestApi.getDb("sale_diamond").where("id", item.sale_diamond_id).update({"is_active": 0, updateddate: date}));
    });
    delete (data.item_array);
    delete (data.customers);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    RestApi.getDb("autogenerate").select("*").where("prefix", "CHD")
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
          return RestApi.getDb("autogenerate").where("prefix", "CHD").update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id") as PromiseLike<any>;
        }
      })
      .then((result) => {
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("change_diamond").insert(data, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("change_diamond_items", item_arr);
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
    const postUrl = `/change-diamond/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/change-diamond" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("change_diamond")
      .leftJoin("customer", "customer_id", "customer.id")
      .where({ "change_diamond.id": data.id })
      .select("change_diamond.*", "customer.code as customer_code", "customer.customer_name", "customer.phone")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("change_diamond_items").leftJoin("item", "item_id", "item.id").leftJoin("category", "change_diamond_items.category_id", "category.id").where("change_diamond_items.change_diamond_id", data.id).select("change_diamond_items.*", "item.item_name", "category_name");
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
        res.render("dashboard/change-diamond-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const query: any = [];
    const date = Utils.toSqlDate(new Date);
    delete (data.item_array);
    delete (data.customers);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    let db = RestApi.getDb("change_diamond");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getDb("change_diamond")
      .leftJoin("change_diamond_items", "change_diamond_id", "change_diamond.id")
      .where("change_diamond_id", data.id)
      .select("change_diamond_items.item_id")
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            query.push(RestApi.getDb("sale_diamond_items").where("item_id", item.item_id).update({"status": null, "updateddate": Utils.toSqlDate(new Date())}));
          });
        }
        item_array.forEach((item: any) => {
          if (item.id && item.id != "") {
            item.updateddate = date;
            item.price = Utils.removeComma(item.price);
            delete item.sale_diamond_voc;
            delete item.item_name;
            delete item.category_name;
          } else {
            item.id = uuid.v4();
            item = comfunc.fillDefaultFields(item);
            item.change_diamond_id = data.id;
          }
          item = comfunc.fillDefaultFields(item);
          query.push(RestApi.getDb("sale_diamond_items").where("item_id", item.item_id).update({"status": "change", "updateddate": Utils.toSqlDate(new Date())}));
          query.push(RestApi.getDb("sale_diamond").where("id", item.sale_diamond_id).update({"is_active": 0, updateddate: date}));
          item_arr.push(item);
        });
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
        return RestApi.getDb("change_diamond_items").where("change_diamond_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("change_diamond_items", item_arr);
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
    RestApi.getDb("change_diamond")
      .leftJoin("change_diamond_items", "change_diamond.id", "change_diamond_items.change_diamond_id")
      .where("change_diamond.id", data.id)
      .select("change_diamond.*", "change_diamond_items.item_id", "change_diamond_items.price")
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            query.push(RestApi.getDb("sale_diamond_items").where({"item_id": item.item_id}).update({"status": null, "updateddate": Utils.toSqlDate(new Date())}));
          });
          if (query.length > 0) {
            return Promise.all(query);
          } else {
            return undefined;
          }
        }
      })
      .then((result) => {
        return RestApi.getDb("change_diamond_items").where("change_diamond_id", data.id).update({"is_delete": 1});
      })
      .then((result) => {
        return RestApi.getDb("change_diamond").where({ id: data.id }).update({ "is_active": 0, "is_delete": 1, "deleted_user_id": user_id, "deleted_date": Utils.toSqlDate(new Date()) });
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
          res.render("dashboard/change-diamond-delete", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/change-diamond-delete", params);
    }
  }

  public postRecover(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    let sale_diamond: any = [];
    const item_arr: any = [];
    const query: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    const user_id: any = req.user.id;
    const date = Utils.toSqlDate(new Date());

    RestApi.getDb("change_diamond_items")
      .where("change_diamond_id", data.id)
      .select()
      .then((result) => {
        result.forEach((item) => {
          item_arr.push(item.item_id);
        });
        // return RestApi.getDb("sale_diamond_items").whereIn("item_id", item_arr).whereNotIn("status", ["change", "return"]).andWhere("is_delete", "0").select();
        return RestApi.getDb("sale_diamond_items").whereIn("item_id", item_arr).andWhere(function () {
          this.whereIn("status", ["change", "return"]).andWhere("is_delete", "1")
        }).select();
      })
      .then((result) => {
        if (result.length > 0) {
          throw new Error("Can not Recover. Already Used!");
        } else {
          return  RestApi.getDb("change_diamond")
                    .leftJoin("change_diamond_items", "change_diamond.id", "change_diamond_items.change_diamond_id")
                    .where("change_diamond.id", data.id)
                    .select("change_diamond.*", "change_diamond_items.item_id", "change_diamond_items.price");
        }
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            query.push(RestApi.getDb("sale_diamond_items").where({"item_id": item.item_id}).update({"status": "change", "updateddate": Utils.toSqlDate(new Date())}));
          });
          if (query.length > 0) {
            return Promise.all(query);
          } else {
            return undefined;
          }
        }
      })
      .then((result) => {
        return RestApi.getDb("change_diamond_items").where("change_diamond_id", data.id).update({ "is_delete": 0 });
      })
      .then((result) => {
        return RestApi.getDb("change_diamond").where("id", data.id).update({ "is_active": 1, "is_delete": 0, "recover_user_id": user_id, "recover_date": Utils.toSqlDate(new Date()) });
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
    const postUrl = `/change-diamond/preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("change_diamond")
      .leftJoin("customer", "change_diamond.customer_id", "customer.id")
      .leftJoin("sale_person", "change_diamond.sale_person_id", "sale_person.id")
      .where({ "change_diamond.id": data.id })
      .select("change_diamond.*", "customer.code as customer_code", "customer.customer_name", "customer.phone", "sale_person.sale_person_name")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].print_date = Utils.toDisplayDate(new Date());
        params.params = Utils.mixin(data, result[0]);
        // Thousand Separator
        params.params.total_amount = Utils.numberWithCommas(params.params.total_amount);
        return RestApi.getDb("change_diamond_items")
          .leftJoin("item", "change_diamond_items.item_id", "item.id")
          .where({ "change_diamond_items.change_diamond_id": data.id })
          .select("change_diamond_items.*", "item.item_name");
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
        res.render("dashboard/change-diamond-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }
}

export default new ChangeDiamondRouter();