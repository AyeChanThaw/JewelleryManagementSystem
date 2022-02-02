/**
 * OrderSettingDiamond Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import { Permission } from "../../lib/permission";
import { QueryBuilder } from "knex";

const jwtCredentialId = config.jwt.defCredentialId;

class OrderSettingDiamondRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/order-setting-diamond").all(Permission.onLoad).get(this.getList);
    this.route("/order-setting-diamond/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/order-setting-diamond/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/order-setting-diamond/receive/:id").all(Permission.onLoad).get(this.getReceive).post(this.postReceive);
    this.route("/order-setting-diamond/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/order-setting-diamond", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-setting-diamond", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/order-setting-diamond/entry", params: {}, listUrl: "/order-setting-diamond" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "OG";
    const count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("order_mould").select("code", "id").whereNull("status").andWhere({ "isallreceived": 1 })
      .then((result) => {
        const mouldcodes: any = [];
        result.forEach((mould) => {
          mouldcodes.push({ value: mould.id, label: mould.code });
        });
        params.mouldcodes = mouldcodes;
        return RestApi.getDb("gold").select("code", "id").where("isallreceived", 1).andWhere("current_wgt_gm", ">", 0);
      })
      .then((result) => {
        const goldcodes: any = [];
        result.forEach((gold) => {
          goldcodes.push({ value: gold.id, label: gold.code });
        });
        params.goldcodes = goldcodes;
        params.orderitems_array = [];
        params.updatediamondarr = [];
        params.params.user = req.user.id;
        if (typeof (<any>req).jwtToken == "function") {
          (<any>req).jwtToken(jwtCredentialId)
            .then((result: string) => {
              params.token = result;
              res.render("dashboard/order-setting-diamond-entry", params);
            })
            .catch((err: any) => {
              next(err);
            });
        } else {
          res.render("dashboard/order-setting-diamond-entry", params);
        }
      })
      .catch((err) => {
        console.log("err ", err);
        res.render("dashboard/order-setting-diamond-entry", params);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.order_goldsmithdate = Utils.toSqlDateWithM(new Date());
    data.id = uuid.v4();
    data.date = Utils.toSqlDate(new Date());
    const update_query: any = [];
    const orderitems_arr = JSON.parse(data.orderitems_array);

    const oitems_arr: any = [];
    orderitems_arr.forEach((orderitems: any) => {
      orderitems.id = uuid.v4();
      orderitems = comfunc.fillDefaultFields(orderitems);
      orderitems.order_goldsmith_id = data.id;
      orderitems.receive_date = undefined;
      orderitems.createddate = Utils.toSqlDate(new Date());
      orderitems.updateddate = Utils.toSqlDate(new Date());

      delete orderitems.orderitems_name;
      delete data.orderitems_length;
      delete orderitems.order_mould_code;
      delete orderitems.diamond_code;
      delete orderitems.gold_code;

      oitems_arr.push(orderitems);
      update_query.push(RestApi.getDb("diamond").where("id", orderitems.diamond_id).decrement("current_qty", orderitems.diamond_qty));
      update_query.push(RestApi.getDb("gold").where("id", orderitems.gold_id).decrement("current_wgt_gm", orderitems.give_gold_wgt_gm));
      update_query.push(RestApi.getDb("order_mould").where("id", orderitems.order_mould_id).update({ "status": "order_goldsmith", "updateddate": Utils.toSqlDate(new Date()) }));
    });

    delete data.orderitems_array;
    delete data.updatediamondarr;
    delete data.order_goldsmithdate;
    delete data.mouldcodes;
    delete data.goldcodes;
    delete data.user;

    const prefix = "OGI";
    let count = 0;
    const updatdate = Utils.toSqlDate(new Date());
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .select()
      .where("prefix", prefix)
      .first()
      .then((result) => {
        if (result.lastdate == datecode) {
          count = result.currentvalue;
        }
        oitems_arr.forEach((item: any) => {
          count++;
          item.code = prefix + datecode + count;
        });
        return RestApi.getDb("autogenerate").where("prefix", prefix).update({ currentvalue: count, lastdate: datecode, updateddate: Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        return RestApi.getDb("order_goldsmith").insert(data, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("order_goldsmith_items", oitems_arr);
      })
      .then((result) => {
        return Promise.all(update_query);
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

    const postUrl = `/order-setting-diamond/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/order-setting-diamond" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("order_goldsmith")
      .where({ "order_goldsmith.id": data.id })
      .select("order_goldsmith.*")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);

        return RestApi.getDb("order_goldsmith_items")
          .leftJoin("order_mould", "order_goldsmith_items.order_mould_id", "order_mould.id")
          .leftJoin("diamond", "order_goldsmith_items.diamond_id", "diamond.id")
          .leftJoin("gold", "order_goldsmith_items.gold_id", "gold.id")
          .where({ "order_goldsmith_items.order_goldsmith_id": data.id })
          .select("order_goldsmith_items.*", "order_mould.code as order_mould_code", "diamond.code as diamond_code", "gold.code as gold_code");
      })
      .then((result) => {
        params.orderitems_array = result;

        return RestApi.getDb("diamond")
          .leftJoin("order_goldsmith_items", "order_goldsmith_items.diamond_id", "diamond.id")
          .where({ "order_goldsmith_items.order_goldsmith_id": data.id })
          .select("diamond.code", "diamond.current_qty");
      })
      .then((result) => {
        params.updatediamondarr = result;

        return RestApi.getDb("order_mould").select("code", "id").whereNull("status").andWhere({ "isallreceived": 1 });
      })
      .then((result) => {
        const mouldcodes: any = [];
        result.forEach((mould) => {
          mouldcodes.push({ label: mould.code, value: mould.id });
        });
        params.mouldcodes = mouldcodes;
        return RestApi.getDb("gold").select("code", "id").where("isallreceived", 1).andWhere("current_wgt_gm", ">", 0);
      })
      .then((result) => {
        const goldcodes: any = [];
        result.forEach((gold) => {
          goldcodes.push({ value: gold.id, label: gold.code });
        });
        params.goldcodes = goldcodes;
        // })
        // .then((result) => {
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/order-goldsmith-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.updateddate = Utils.toSqlDate(new Date());
    let db = RestApi.getDb("order_goldsmith");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    const id = data.id;
    db = db.where({ id: data.id });
    delete (data.id);
    delete data.updatediamondarr;
    delete data.orderitems_length;
    delete data.index;
    delete data.mouldcodes;
    delete data.goldcodes;
    delete data.user;
    delete data.product_name;
    delete data.order_goldsmith_code;
    delete data.order_mould_code_;
    delete data.diamond_code;
    delete data.diamond_qty;
    delete data.gold_code;
    delete data.give_gold_wgt_gm;
    const orderitems_arr = JSON.parse(data.orderitems_array);
    const order_arr: any = [];
    orderitems_arr.forEach((item: any) => {
      item.id = uuid.v4();
      item.order_goldsmith_id = id;
      item = comfunc.fillDefaultFields(item);
      delete item.orderitems_name;
      delete data.orderitems_length;
      delete item.order_mould_code;
      delete item.diamond_code;
      delete item.gold_code;
      order_arr.push(item);
    });

    delete data.orderitems_array;

    const query: any = [];
    RestApi.getDb("order_goldsmith_items")
      .leftJoin("diamond", "order_goldsmith_items.diamond_id", "diamond.id")
      .leftJoin("gold", "order_goldsmith_items.gold_id", "gold.id")
      .select("diamond.id as diamond_id", "gold.id as gold_id", "order_goldsmith_items.diamond_qty", "order_goldsmith_items.give_gold_wgt_gm", "diamond.current_qty", "order_goldsmith_items.order_mould_id")
      .where("order_goldsmith_items.order_goldsmith_id", id)
      .then((result) => {
        result.forEach((item: any) => {
          query.push(RestApi.getDb("diamond").where("id", item.diamond_id).increment("current_qty", item.diamond_qty));
          query.push(RestApi.getDb("gold").where("id", item.gold_id).increment("current_wgt_gm", item.give_gold_wgt_gm));
          query.push(RestApi.getDb("order_mould").where("id", item.order_mould_id).update({ "status": undefined, updateddate: Utils.toSqlDate(new Date) }));
        });
        order_arr.forEach((order: any) => {
          query.push(RestApi.getDb("diamond").where("id", order.diamond_id).decrement("current_qty", order.diamond_qty));
          query.push(RestApi.getDb("gold").where("id", order.gold_id).decrement("current_wgt_gm", order.give_gold_wgt_gm));
          query.push(RestApi.getDb("order_mould").where("id", order.order_mould_id).update({ "status": "order_goldsmith", updateddate: Utils.toSqlDate(new Date) }));
        });
      })
      .then((result) => {
        return db.update(data, "id");
      })
      .then((result) => {
        return RestApi.getDb("order_goldsmith_items").where({ order_goldsmith_id: id }).delete("id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("order_goldsmith_items", order_arr);
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

  public getReceive(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/order-setting-diamond/receive/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/order-setting-diamond" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("order_goldsmith")
      .leftJoin("goldsmith", "order_goldsmith.goldsmith_id", "goldsmith.id")
      .where("order_goldsmith.id", data.id)
      .select("order_goldsmith.*", "goldsmith.goldsmith_name as goldsmith")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);

        return RestApi.getDb("order_goldsmith_items")
          .leftJoin("diamond", "order_goldsmith_items.diamond_id", "diamond.id")
          .leftJoin("order_mould", "order_goldsmith_items.order_mould_id", "order_mould.id")
          .where("order_goldsmith_items.order_goldsmith_id", data.id)
          .select("order_goldsmith_items.*", "diamond.code as diamond_code", "order_mould.code as order_mould_code");
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            item.receive_date = Utils.toDisplayDate(item.receive_date);
          });
        }
        params.orderitems_array = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/order-setting-diamond-receive", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postReceive(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = req.body;
    const orderitems_array = JSON.parse(data.orderitems_array);
    const query: any = [];
    let exist: any = 1;
    if (orderitems_array.length > 1) {
      orderitems_array.forEach((item: any, index: number) => {
        const receive_date = data.receive_date;
        const accept_person = data.accept_person;
        const received_diamond_qty = data.received_diamond_qty;
        const received_gold_wgt_gm = data.received_gold_wgt_gm;
        const received_percent = data.received_percent;
        const received_percent_amount = data.received_percent_amount;
        const cost = data.cost;
        let allExist: any = 1;
        const detail: any = {};
        if (item.isreceived != 1) {
          if (receive_date[index] != "") {
            detail.receive_date = Utils.toSqlDate(receive_date[index]);
          }
          else {
            allExist = 0;
          }
          if (accept_person[index] != "") {
            detail.accept_person = accept_person[index];
          }
          else {
            allExist = 0;
          }
          if (item.diamond_qty != 0) {
            if (received_diamond_qty[0] != "") {
              detail.received_diamond_qty = received_diamond_qty[0];
            }
            else {
              allExist = 0;
            }
          }
          if (received_gold_wgt_gm[0] != "") {
            detail.received_gold_wgt_gm = received_gold_wgt_gm[0];
          }
          else {
            allExist = 0;
          }
          if (received_percent[0] != "") {
            detail.received_percent = received_percent[0];
          }
          else {
            allExist = 0;
          }
          if (received_percent_amount[0] != "") {
            detail.received_percent_amount = received_percent_amount[0];
          }
          else {
            allExist = 0;
          }
          if (cost[0] != 0) {
            detail.cost = cost[0];
          }
          else {
            allExist = 0;
          }
          if (allExist == 1) {
            detail.updateddate = Utils.toSqlDate(new Date());
            detail.isreceived = 1;
            query.push(RestApi.getDb("order_goldsmith_items").where("id", item.id).update(detail, "id"));
            query.push(RestApi.getDb("order_goldsmith").where("id", data.id).update({ "isreceived": 1, "updateddate": Utils.toSqlDate(new Date()) }, "id"));
            query.push(RestApi.getDb("gold").where("id", item.gold_id).increment("current_wgt_gm", detail.received_gold_wgt_gm));
            query.push(RestApi.getDb("diamond").where("id", item.diamond_id).increment("current_qty", detail.received_diamond_qty));
          } else {
            exist = 0;
          }
        }
      });
    } else {
      let allExist: any = 1;
      const detail: any = {};
      if (orderitems_array[0].isreceived != 1) {
        if (data.receive_date != "") {
          detail.receive_date = Utils.toSqlDate(data.receive_date);
        }
        else {
          allExist = 0;
        }
        if (data.accept_person != "") {
          detail.accept_person = data.accept_person;
        }
        else {
          allExist = 0;
        }
        if (orderitems_array[0].diamond_qty != 0) {
          if (data.received_diamond_qty != "") {
            detail.received_diamond_qty = data.received_diamond_qty;
          }
          else
            allExist = 0;
        }
        if (data.received_gold_wgt_gm != "") {
          detail.received_gold_wgt_gm = data.received_gold_wgt_gm;
        }
        else
          allExist = 0;
        if (data.received_percent != "") {
          detail.received_percent = data.received_percent;
        }
        else
          allExist = 0;
        if (data.received_percent_amount != "") {
          detail.received_percent_amount = data.received_percent_amount;
        }
        else
          allExist = 0;
        if (data.cost != "") {
          detail.cost = data.cost;
        }
        else
          allExist = 0;
        if (allExist == 1) {
          detail.updateddate = Utils.toSqlDate(new Date());
          detail.isreceived = 1;
          query.push(RestApi.getDb("order_goldsmith_items").where("id", orderitems_array[0].id).update(detail, "id"));
          query.push(RestApi.getDb("order_goldsmith").where("id", data.id).update({ "isreceived": 1, "updateddate": Utils.toSqlDate(new Date()) }, "id"));
          query.push(RestApi.getDb("gold").where("id", orderitems_array[0].gold_id).increment("current_wgt_gm", detail.received_gold_wgt_gm));
          query.push(RestApi.getDb("diamond").where("id", orderitems_array[0].diamond_id).increment("current_qty", detail.received_diamond_qty));
        } else {
          exist = 0;
        }
      }
    }
    if (exist == 1)
      query.push(RestApi.getDb("order_goldsmith").where("id", data.id).update({ "isallreceived": 1, "updateddate": Utils.toSqlDate(new Date()) }, "id"));
    Promise.all(query)
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
    let db = RestApi.getDb("order_goldsmith_items");
    db = db.where({ order_goldsmith_id: data.id });
    const query: any = [];
    RestApi.getDb("order_goldsmith_items")
      .where("order_goldsmith_id", data.id)
      .select()
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            if (item.diamond_id != "")
              query.push(RestApi.getDb("diamond").where("id", item.diamond_id).increment("current_qty", item.diamond_qty));
            if (item.gold_id != "")
              query.push(RestApi.getDb("gold").where("id", item.gold_id).increment("current_wgt_gm", item.give_gold_wgt_gm));
            query.push(RestApi.getDb("order_mould").where("id", item.order_mould_id).update({ status: null, updateddate: Utils.toSqlDate(new Date()) }));
          });
        }
        return Promise.all(query);
      })
      .then((result) => {
        return db.delete("order_goldsmith_id");
      })
      .then((result) => {
        return RestApi.getDb("order_goldsmith").where({ id: data.id }).delete("id");
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

export default new OrderSettingDiamondRouter();