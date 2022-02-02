/**
 * User Role
 */
import express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class UserRoleRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/userrole").all(Permission.onLoad).get(this.getList);
    this.route("/userrole/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/userrole/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/userrole/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/userrole", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/userrole", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/userrole/entry", params: {}, listUrl: "/userrole" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("program").select()
      .then((result) => {
        params.items = result;
        return RestApi.getDb("user_role").select();
      })
      .then((result) => {
        params.orirole = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          res.render("dashboard/userrole-entry", params);
        }
      })
      .then((result: string) => {
        params.token = result;
        res.render("dashboard/userrole-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data: any = comfunc.fillDefaultFields(req.body);
    const role_data: any = {
      id: uuid.v4(),
      role: data.role,
      description: data.description || "",
      selectall: data.select_all == "on" ? 1 : 0,
      createddate: Utils.toSqlDate(new Date()),
      updateddate: Utils.toSqlDate(new Date())
    };
    const queries: string[] = [];
    let insertQuery = "INSERT INTO `user_role_item`(`id`, `roleid`, `programid`, `read`, `write`, `delete`, `createddate`, `updateddate`) VALUES ";
    if (Array.isArray(data.programid)) {
      for (let i = 0; i < data.programid.length; i++) {

        const _read = data["read_" + data.programid[i]] == "on" ? 1 : 0;
        const _write = data["write_" + data.programid[i]] == "on" ? 1 : 0;
        const _delete = data["delete_" + data.programid[i]] == "on" ? 1 : 0;

        const item_query: string = "(UUID(), '" + role_data.id + "', '" + data.programid[i] + "', " + _read + ", " + _write + ", " + _delete + ", '" + role_data.createddate + "', '" + Utils.toSqlDate(new Date()) + "')";

        queries.push(item_query);
      }
    }
    insertQuery += queries.join(",") + ";";

    const db = RestApi.getDb("user_role");
    db.insert(role_data, "id")
      .then((result) => {
        return RestApi.getKnex().raw(insertQuery);
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
    const self = this;
    const data = { id: req.params.id };
    let role_data: any = {};
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }

    let params: any = { title: config.appname, user: req.user.username, listUrl: "/userrole", params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("user_role").where({ id: data.id }).select()
      .then((result) => {
        role_data = result[0];
        return RestApi.getDb().columns("program.*", "user_role_item.read", "user_role_item.write", "user_role_item.delete")
          .select()
          .from("program")
          .leftJoin("user_role_item", "user_role_item.programid", "program.id")
          .where({ "user_role_item.roleid": data.id });
      })
      .then((result) => {
        params.params = Utils.mixin(data, role_data);
        params.items = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/userrole-entry", params);
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
    const role_data: any = {
      role: data.role,
      description: data.description || "",
      selectall: data.select_all == "on" ? 1 : 0,
      updated_date: data.updated_date
    };
    const queries: string[] = [];
    const deleteQuery = (data.id != "") ? "DELETE FROM `user_role_item` WHERE `roleid` = '" + data.id + "';" : "";

    let createddate = Utils.toSqlDate(new Date());
    let insertQuery = "INSERT INTO `user_role_item`(`id`, `roleid`, `programid`, `read`, `write`, `delete`, `createddate`, `updateddate`) VALUES ";
    if (Array.isArray(data.programid)) {
      for (let i = 0; i < data.programid.length; i++) {

        if (data.createddate != "") {
          createddate = data.createddate;
        }
        const _read = data["read_" + data.programid[i]] == "on" ? 1 : 0;
        const _write = data["write_" + data.programid[i]] == "on" ? 1 : 0;
        const _delete = data["delete_" + data.programid[i]] == "on" ? 1 : 0;

        const item_query: string = "(UUID(), '" + data.id + "', '" + data.programid[i] + "', " + _read + ", " + _write + ", " + _delete + ", '" + createddate + "', '" + Utils.toSqlDate(new Date()) + "')";
        queries.push(item_query);
      }
    }
    insertQuery += queries.join(",") + ";";

    const db = RestApi.getDb("user_role").where({ id: data.id });
    delete (data.id);
    db.update(role_data, "id")
      .then((result) => {
        return RestApi.getKnex().raw(deleteQuery);
      })
      .then((result) => {
        return RestApi.getKnex().raw(insertQuery);
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
    RestApi.getDb("user").where("roleid", data.id)
      .then((user) => {
        if (user.length > 0) {
          throw new Error("Can not delete.");
        } else {
          return RestApi.getDb("user_role").where({ id: data.id }).delete();
        }
      })
      .then((delete_role) => {
        return RestApi.getDb("user_role_item").where({ roleid: data.id }).delete();
      })
      .then((delete_role_item) => {
        res.json({ "success": delete_role_item });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public setMenuParams(params: any, req: express.Request, res: express.Response): any {
    params.login = req.isAuthenticated();
    params.permission = res.locals.permission;
    if (typeof (<any>req).jwtToken == "function") {
      return (<any>req).jwtToken(jwtCredentialId);
    } else {
      return Promise.resolve("");
    }
  }
}


export default new UserRoleRouter();