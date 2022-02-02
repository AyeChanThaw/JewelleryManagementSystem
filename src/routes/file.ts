/**
 * File Router
 */
import * as fs from "fs";
import * as pathModule from "path";
import * as formidable from "formidable";
import * as XLSX from "ts-xlsx";
import { IncomingMessage, ServerResponse } from "http";
import * as mediaserver from "../lib/mediaserver";
import * as RestApi from "../lib/restapi";
import * as comfunc from "../lib/comfunc";
import * as uuid from "uuid";
import { Utils } from "../lib/utils";

class FileRouter {
  static MAX_UPLOAD_SIZE = 15 * 1024 * 1024; // 15MB
  private publicDir: string;

  constructor() {}

  private static decodeUrl(url: string): string {
    url = `${url}`;
    try {
      url = decodeURIComponent(url);
    } catch (err) { }
    url = url.replace(/%([0-9A-F]{2})/g, (x, x1) => {
      return String.fromCharCode(parseInt(x1, 16));
    });
    return url;
  }

  public init(options?: any) {
    if (!options) {
      options = {};
    }
    this.publicDir = this.findPublic(__dirname);

    return (req: IncomingMessage, res: ServerResponse, next: Function) => {
      const url = req.url;
      if (/^\/upload\/.*/i.test(url)) {
        const params: any = {};
        const keys = [ "type" ];
        const match = /^\/upload\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }

        (<any>req).params = params;
        this.upload(req, res, next);

      } else if (/^\/cashinimport\/.*/i.test(url)) {
        const params: any = {};
        const keys = ["type"];
        const match = /^\/cashinimport\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }
        (<any>req).params = params;
        this.import(req, res, next);

      } else if (/^\/cashinsrimport\/.*/i.test(url)) {
        const params: any = {};
        const keys = ["type"];
        const match = /^\/cashinsrimport\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }
        (<any>req).params = params;
        this.import_cashinsr(req, res, next);

      } else if (/^\/usageimport\/.*/i.test(url)) {
        const params: any = {};
        const keys = ["type"];
        const match = /^\/usageimport\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }
        (<any>req).params = params;
        this.import_usage(req, res, next);

      } else if (/^\/usagesrimport\/.*/i.test(url)) {
        const params: any = {};
        const keys = ["type"];
        const match = /^\/usagesrimport\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }
        (<any>req).params = params;
        this.import_usagesr(req, res, next);

      } else if (/^\/delete/i.test(url)) {
        this.delete(req, res, next);

      } else if (/^\/stream/i.test(url)) {
        this.stream(req, res, next);
      } else {
        next();
      }
    };
  }

  private findPublic(dir: string): string {
    const t = pathModule.dirname(dir);
    const pubDir = pathModule.join(t, "public");
    if (!fs.existsSync(pubDir)) {
      const p = pathModule.join(t, "package.json");
      if (fs.existsSync(p)) {
        throw new Error("Public directory not found!");
      }
      return this.findPublic(t);
    }
    return pubDir;
  }

  public upload(req: IncomingMessage, res: ServerResponse, next: Function) {
    const type = (<any>req).params.type;
    const uploadDir = pathModule.join(this.publicDir, "upload", type);
    console.log(`file: ${uploadDir}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    const form = new formidable.IncomingForm();
    const uploads: string[] = [];
    form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
    form.multiples = true;
    form.uploadDir = uploadDir;
    form.on("file", function(field, file) {
      let fileName = file.name.replace(/\s/g, "-");
      const origFileName = fileName;
      let count = 0;
      while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
        count++;
        const match = origFileName.match(/^(.*)\.([^\.]+)$/);
        if (match) {
          fileName = `${match[1]}-(${count}).${match[2]}`;
        } else {
          fileName = `${origFileName}-(${count})`;
        }
      }
      fs.rename(file.path, pathModule.join(uploadDir, fileName), (err) => {});
      const filePath = `./upload/${type}/${fileName}`;
      console.log("UPLOAD " + filePath);
      uploads.push(filePath);
    });
    form.on("error", function(err) {
      console.log(`An error has occured: \n${err}`);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("end", function() {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ "message": "success", "files": uploads }));
    });
    form.parse(req);
  }

  public import(req: IncomingMessage, res: ServerResponse, next: Function) {
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": 1728000
    };
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers);
      return res.end();
    }
    headers["Content-Type"] = "application/json";

    const type = (<any>req).params.type;
    console.log("type ", type);
    const uploadDir = pathModule.join(this.publicDir, "upload", type);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    const form = new formidable.IncomingForm();
    const uploads: string[] = [];
    form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
    form.multiples = true;
    form.uploadDir = uploadDir;
    form.on("file", function (field, file, err) {
      let fileName = file.name.replace(/\s/g, "-");
      const origFileName = fileName;
      let count = 0;
      while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
        count++;
        const match = origFileName.match(/^(.*)\.([^\.]+)$/);
        if (match) {
          fileName = `${match[1]}-(${count}).${match[2]}`;
        } else {
          fileName = `${origFileName}-(${count})`;
        }
      }

      fs.rename(file.path, pathModule.join(uploadDir, fileName), (err) => { });
      const filePath = `./upload/${type}/${fileName}`;
      console.log("filePath ", filePath);
      uploads.push(filePath);

      if (err) {
        console.log("Err Excel Upload", err);
      } else {
        const exactPath = pathModule.join("public", "upload", type, fileName);
        console.log("Path ", exactPath);
        // Get Data From Excel
        const workbook = XLSX.readFile(exactPath);
        const sheet_name_list = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        const child_data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[1]]);
        const query: any = [];
        const daily_cash_arr: any = [];
        const payment_arr: any = [];
        const cash_arr: any = [];
        let banks: any = [];
        const updateddate = Utils.toSqlDate(new Date());
        for (const key in child_data) {

          const child_value = child_data[key];
          const real_child_data = comfunc.fillDefaultFields(child_value);
          // console.log("data ", realdata);
          // if (realdata.balance > 0) {
          //   console.log("product code ", realdata.productcode, " balance ", realdata.balance);
          //   query.push(RestApi.getDb("bundle").where("productcode", realdata.productcode).update({ balance: realdata.balance, unitprice: realdata.original_price, discountprice: realdata.discount_price, updateddate: realdata.updateddate }));
          // }
        }
        RestApi.getDb("bank").select()
          .then((result) => {
            banks = result;
            for (const child_key in child_data) {
              const child_value = child_data[child_key];
              const child_realdata = comfunc.fillDefaultFields(child_value);
              let isBank = 0;
              if (isBank == 0) {
                banks.forEach((bank: any) => {
                  console.log("Enter bank loop ");
                  if (child_realdata.bank == bank.account) {
                    console.log("equal bank");
                    child_realdata["bank_id"] = bank.id;
                    child_realdata["id"] = uuid.v4();
                    child_realdata["payment_type"] = "bank";
                    isBank = 1;
                  }
                });
              }
              console.log("isBank ", isBank);
              console.log("child data ", child_realdata);
              if (isBank == 0) {
                child_realdata["bank_id"] = "";
                child_realdata["id"] = uuid.v4();
                child_realdata["payment_type"] = "cash";
              }
              child_realdata["type"] = "cash_in";
              delete(child_realdata.bank);
              payment_arr.push(child_realdata);
            }
            return RestApi.getDb("daily_cash_in_type").select();
          })
          .then((result) => {
            const types = result;
            for (const key in data) {
              const value = data[key];
              const realdata = comfunc.fillDefaultFields(value);
              types.forEach((type) => {
                if (type.code == realdata.cash_type) {
                  const id = realdata.id;
                  realdata.id = uuid.v4();
                  realdata.date = Utils.toSqlDate(realdata.date);
                  realdata["daily_cash_in_type_id"] = type.id;
                  let bank_amount = 0;
                  let cash_amount = 0;
                  let total_amount = 0;
                  payment_arr.forEach((payment: any) => {
                    if (payment.cash_id == id) {
                      if (payment.payment_type == "cash") {
                        cash_amount += Number(payment.amount);
                      } else {
                        bank_amount += Number(payment.amount);
                      }
                      total_amount += Number(payment.amount);
                      payment.cash_id = realdata.id;
                    }
                  });
                  realdata["bank_amount"] = bank_amount;
                  realdata["cash_amount"] = cash_amount;
                  realdata["total_amount"] = total_amount;
                  delete(realdata.cash_type);
                  daily_cash_arr.push(realdata);
                  let cash: any = {};
                  cash.id = uuid.v4();
                  cash.date = Utils.toSqlDate(new Date());
                  cash.type_id = realdata.id;
                  cash.cash_in = total_amount;
                  cash.status = "daily_cash_in_showroom";
                  cash.type = "daily_cash_in_showroom";
                  cash.user_id = 1;
                  cash = comfunc.fillDefaultFields(cash);
                  cash_arr.push(cash);
                }
              });
            }
            console.log("daily_cash_payment ", payment_arr);
            console.log("daily_cash_in ", daily_cash_arr);
            query.push(RestApi.getKnex().batchInsert("daily_cash", cash_arr));
            query.push(RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr));
            query.push(RestApi.getKnex().batchInsert("daily_cash_in", daily_cash_arr));
            return Promise.all(query);
          })
          .then((result) => {
            // res.json({ "success": result });
            // res.render("dashboard/bundle", params);
          })
          .catch((err) => {
            console.log("err in importing daily cash ", `${err}`);
            // res.json({ "error": err });
          });
      }
    });
    form.on("error", function (err) {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("end", function () {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "success", "files": uploads }));
    });
    form.parse(req);
  }

  public import_cashinsr(req: IncomingMessage, res: ServerResponse, next: Function) {
    console.log("Import cash In Showroom");
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": 1728000
    };
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers);
      return res.end();
    }
    headers["Content-Type"] = "application/json";

    // const type = (<any>req).params.type;
    const type = "import";
    console.log("type ", type);
    console.log("publicDir ", this.publicDir);
    const uploadDir = pathModule.join(this.publicDir, "upload", type);
    console.log("uploadDir ", uploadDir);
    if (!fs.existsSync(uploadDir)) {
      console.log("Enter If");
      fs.mkdirSync(uploadDir);
    }
    console.log("Finish If");
    const form = new formidable.IncomingForm();
    const uploads: string[] = [];
    form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
    form.multiples = true;
    form.uploadDir = uploadDir;
    form.on("file", function (field, file, err) {
      let fileName = file.name.replace(/\s/g, "-");
      console.log("fileName ", fileName);
      const origFileName = fileName;
      console.log("origFileName ", origFileName);
      let count = 0;
      while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
        count++;
        const match = origFileName.match(/^(.*)\.([^\.]+)$/);
        if (match) {
          fileName = `${match[1]}-(${count}).${match[2]}`;
        } else {
          fileName = `${origFileName}-(${count})`;
        }
      }

      fs.rename(file.path, pathModule.join(uploadDir, fileName), (err) => { });
      const filePath = `./upload/${type}/${fileName}`;
      console.log("filePath ", filePath);
      uploads.push(filePath);

      if (err) {
        console.log("Err Excel Upload", err);
      } else {
        const exactPath = pathModule.join("public", "upload", type, fileName);
        console.log("Path ", exactPath);
        // Get Data From Excel
        const workbook = XLSX.readFile(exactPath);
        const sheet_name_list = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        const child_data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[1]]);
        const query: any = [];
        const daily_cash_arr: any = [];
        const payment_arr: any = [];
        const cash_arr: any = [];
        let banks: any = [];
        const updateddate = Utils.toSqlDate(new Date());
        for (const key in child_data) {

          const child_value = child_data[key];
          const real_child_data = comfunc.fillDefaultFields(child_value);
          // console.log("data ", realdata);
          // if (realdata.balance > 0) {
          //   console.log("product code ", realdata.productcode, " balance ", realdata.balance);
          //   query.push(RestApi.getDb("bundle").where("productcode", realdata.productcode).update({ balance: realdata.balance, unitprice: realdata.original_price, discountprice: realdata.discount_price, updateddate: realdata.updateddate }));
          // }
        }
        RestApi.getDb("bank").select()
          .then((result) => {
            banks = result;
            for (const child_key in child_data) {
              const child_value = child_data[child_key];
              const child_realdata = comfunc.fillDefaultFields(child_value);
              let isBank = 0;
              if (isBank == 0) {
                banks.forEach((bank: any) => {
                  console.log("Enter bank loop ");
                  if (child_realdata.bank == bank.account) {
                    console.log("equal bank");
                    child_realdata["bank_id"] = bank.id;
                    child_realdata["id"] = uuid.v4();
                    child_realdata["payment_type"] = "bank";
                    isBank = 1;
                  }
                });
              }
              console.log("isBank ", isBank);
              console.log("child data ", child_realdata);
              if (isBank == 0) {
                child_realdata["bank_id"] = "";
                child_realdata["id"] = uuid.v4();
                child_realdata["payment_type"] = "cash";
              }
              child_realdata["type"] = "cash_in_showroom";
              delete(child_realdata.bank);
              payment_arr.push(child_realdata);
            }
            return RestApi.getDb("daily_cash_in_type").select();
          })
          .then((result) => {
            const types = result;
            for (const key in data) {
              const value = data[key];
              const realdata = comfunc.fillDefaultFields(value);
              types.forEach((type) => {
                if (type.code == realdata.cash_type) {
                  const id = realdata.id;
                  realdata.id = uuid.v4();
                  realdata.date = Utils.toSqlDate(realdata.date);
                  realdata["daily_cash_in_type_id"] = type.id;
                  let bank_amount = 0;
                  let cash_amount = 0;
                  let total_amount = 0;
                  payment_arr.forEach((payment: any) => {
                    if (payment.cash_id == id) {
                      if (payment.payment_type == "cash") {
                        cash_amount += Number(payment.amount);
                      } else {
                        bank_amount += Number(payment.amount);
                      }
                      total_amount += Number(payment.amount);
                      payment.cash_id = realdata.id;
                    }
                  });
                  realdata["bank_amount"] = bank_amount;
                  realdata["cash_amount"] = cash_amount;
                  realdata["total_amount"] = total_amount;
                  console.log("realdata ", realdata);
                  delete(realdata.cash_type);
                  daily_cash_arr.push(realdata);
                  let cash: any = {};
                  cash.id = uuid.v4();
                  cash.date = Utils.toSqlDate(new Date());
                  cash.type_id = realdata.id;
                  cash.cash_in = total_amount;
                  cash.status = "daily_cash_in_showroom";
                  cash.type = "daily_cash_in_showroom";
                  cash.user_id = 1;
                  cash = comfunc.fillDefaultFields(cash);
                  cash_arr.push(cash);
                }
              });
            }
            console.log("daily_cash_payment ", payment_arr);
            console.log("daily_cash_in ", daily_cash_arr);
            query.push(RestApi.getKnex().batchInsert("daily_cash", cash_arr));
            query.push(RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr));
            query.push(RestApi.getKnex().batchInsert("daily_cash_in_showroom", daily_cash_arr));
            return Promise.all(query);
          })
          .then((result) => {
            // res.json({ "success": result });
            // res.render("dashboard/bundle", params);
          })
          .catch((err) => {
            console.log("err in importing daily cash ", `${err}`);
            // res.json({ "error": err });
          });
      }
    });
    form.on("error", function (err) {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("end", function () {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "success", "files": uploads }));
    });
    form.parse(req);
  }

  public import_usage(req: IncomingMessage, res: ServerResponse, next: Function) {
    console.log("Import Usage");
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": 1728000
    };
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers);
      return res.end();
    }
    headers["Content-Type"] = "application/json";

    // const type = (<any>req).params.type;
    const type = "import";
    console.log("type ", type);
    console.log("publicDir ", this.publicDir);
    const uploadDir = pathModule.join(this.publicDir, "upload", type);
    console.log("uploadDir ", uploadDir);
    if (!fs.existsSync(uploadDir)) {
      console.log("Enter If");
      fs.mkdirSync(uploadDir);
    }
    console.log("Finish If");
    const form = new formidable.IncomingForm();
    const uploads: string[] = [];
    form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
    form.multiples = true;
    form.uploadDir = uploadDir;
    form.on("file", function (field, file, err) {
      let fileName = file.name.replace(/\s/g, "-");
      console.log("fileName ", fileName);
      const origFileName = fileName;
      console.log("origFileName ", origFileName);
      let count = 0;
      while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
        count++;
        const match = origFileName.match(/^(.*)\.([^\.]+)$/);
        if (match) {
          fileName = `${match[1]}-(${count}).${match[2]}`;
        } else {
          fileName = `${origFileName}-(${count})`;
        }
      }

      fs.rename(file.path, pathModule.join(uploadDir, fileName), (err) => { });
      const filePath = `./upload/${type}/${fileName}`;
      console.log("filePath ", filePath);
      uploads.push(filePath);

      if (err) {
        console.log("Err Excel Upload", err);
      } else {
        const exactPath = pathModule.join("public", "upload", type, fileName);
        console.log("Path ", exactPath);
        // Get Data From Excel
        const workbook = XLSX.readFile(exactPath);
        const sheet_name_list = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        const child_data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[1]]);
        const query: any = [];
        const daily_usage_arr: any = [];
        const payment_arr: any = [];
        const cash_arr: any = [];
        let banks: any = [];
        const updateddate = Utils.toSqlDate(new Date());
        for (const key in child_data) {

          const child_value = child_data[key];
          const real_child_data = comfunc.fillDefaultFields(child_value);
          // console.log("data ", realdata);
          // if (realdata.balance > 0) {
          //   console.log("product code ", realdata.productcode, " balance ", realdata.balance);
          //   query.push(RestApi.getDb("bundle").where("productcode", realdata.productcode).update({ balance: realdata.balance, unitprice: realdata.original_price, discountprice: realdata.discount_price, updateddate: realdata.updateddate }));
          // }
        }
        RestApi.getDb("bank").select()
          .then((result) => {
            banks = result;
            for (const child_key in child_data) {
              const child_value = child_data[child_key];
              const child_realdata = comfunc.fillDefaultFields(child_value);
              let isBank = 0;
              if (isBank == 0) {
                banks.forEach((bank: any) => {
                  console.log("Enter bank loop ");
                  if (child_realdata.bank == bank.account) {
                    console.log("equal bank");
                    child_realdata["bank_id"] = bank.id;
                    child_realdata["id"] = uuid.v4();
                    child_realdata["payment_type"] = "bank";
                    isBank = 1;
                  }
                });
              }
              console.log("isBank ", isBank);
              console.log("child data ", child_realdata);
              if (isBank == 0) {
                child_realdata["bank_id"] = "";
                child_realdata["id"] = uuid.v4();
                child_realdata["payment_type"] = "cash";
              }
              child_realdata["type"] = "usage";
              delete(child_realdata.bank);
              payment_arr.push(child_realdata);
            }
            return RestApi.getDb("daily_cash_type").select();
          })
          .then((result) => {
            const types = result;
            for (const key in data) {
              const value = data[key];
              const realdata = comfunc.fillDefaultFields(value);
              types.forEach((type) => {
                if (type.code == realdata.cash_type) {
                  const id = realdata.id;
                  realdata.id = uuid.v4();
                  realdata.date = Utils.toSqlDate(realdata.date);
                  realdata["daily_cash_type_id"] = type.id;
                  let bank_amount = 0;
                  let cash_amount = 0;
                  let total_amount = 0;
                  payment_arr.forEach((payment: any) => {
                    if (payment.cash_id == id) {
                      if (payment.payment_type == "cash") {
                        cash_amount += Number(payment.amount);
                      } else {
                        bank_amount += Number(payment.amount);
                      }
                      total_amount += Number(payment.amount);
                      payment.cash_id = realdata.id;
                    }
                  });
                  realdata["bank_amount"] = bank_amount;
                  realdata["cash_amount"] = cash_amount;
                  realdata["total_amount"] = total_amount;
                  console.log("realdata ", realdata);
                  delete(realdata.cash_type);
                  daily_usage_arr.push(realdata);
                  let cash: any = {};
                  cash.id = uuid.v4();
                  cash.date = Utils.toSqlDate(new Date());
                  cash.type_id = realdata.id;
                  cash.cash_out = total_amount;
                  cash.status = "daily_usage";
                  cash.type = "daily_usage";
                  cash.user_id = 1;
                  cash = comfunc.fillDefaultFields(cash);
                  cash_arr.push(cash);
                }
              });
            }
            console.log("daily_cash_payment ", payment_arr);
            console.log("daily_usage ", daily_usage_arr);
            query.push(RestApi.getKnex().batchInsert("daily_cash", cash_arr));
            query.push(RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr));
            query.push(RestApi.getKnex().batchInsert("daily_usage", daily_usage_arr));
            return Promise.all(query);
          })
          .then((result) => {
            // res.json({ "success": result });
            // res.render("dashboard/bundle", params);
          })
          .catch((err) => {
            console.log("err in importing daily cash ", `${err}`);
            // res.json({ "error": err });
          });
      }
    });
    form.on("error", function (err) {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("end", function () {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "success", "files": uploads }));
    });
    form.parse(req);
  }

  public import_usagesr(req: IncomingMessage, res: ServerResponse, next: Function) {
    console.log("Import Usage Showroom");
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": 1728000
    };
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers);
      return res.end();
    }
    headers["Content-Type"] = "application/json";

    // const type = (<any>req).params.type;
    const type = "import";
    console.log("type ", type);
    console.log("publicDir ", this.publicDir);
    const uploadDir = pathModule.join(this.publicDir, "upload", type);
    console.log("uploadDir ", uploadDir);
    if (!fs.existsSync(uploadDir)) {
      console.log("Enter If");
      fs.mkdirSync(uploadDir);
    }
    console.log("Finish If");
    const form = new formidable.IncomingForm();
    const uploads: string[] = [];
    form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
    form.multiples = true;
    form.uploadDir = uploadDir;
    form.on("file", function (field, file, err) {
      let fileName = file.name.replace(/\s/g, "-");
      console.log("fileName ", fileName);
      const origFileName = fileName;
      console.log("origFileName ", origFileName);
      let count = 0;
      while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
        count++;
        const match = origFileName.match(/^(.*)\.([^\.]+)$/);
        if (match) {
          fileName = `${match[1]}-(${count}).${match[2]}`;
        } else {
          fileName = `${origFileName}-(${count})`;
        }
      }

      fs.rename(file.path, pathModule.join(uploadDir, fileName), (err) => { });
      const filePath = `./upload/${type}/${fileName}`;
      console.log("filePath ", filePath);
      uploads.push(filePath);

      if (err) {
        console.log("Err Excel Upload", err);
      } else {
        const exactPath = pathModule.join("public", "upload", type, fileName);
        console.log("Path ", exactPath);
        // Get Data From Excel
        const workbook = XLSX.readFile(exactPath);
        const sheet_name_list = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        const child_data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[1]]);
        const query: any = [];
        const daily_usage_arr: any = [];
        const payment_arr: any = [];
        const cash_arr: any = [];
        let banks: any = [];
        const updateddate = Utils.toSqlDate(new Date());
        for (const key in child_data) {

          const child_value = child_data[key];
          const real_child_data = comfunc.fillDefaultFields(child_value);
          // console.log("data ", realdata);
          // if (realdata.balance > 0) {
          //   console.log("product code ", realdata.productcode, " balance ", realdata.balance);
          //   query.push(RestApi.getDb("bundle").where("productcode", realdata.productcode).update({ balance: realdata.balance, unitprice: realdata.original_price, discountprice: realdata.discount_price, updateddate: realdata.updateddate }));
          // }
        }
        RestApi.getDb("bank").select()
          .then((result) => {
            banks = result;
            for (const child_key in child_data) {
              const child_value = child_data[child_key];
              const child_realdata = comfunc.fillDefaultFields(child_value);
              let isBank = 0;
              if (isBank == 0) {
                banks.forEach((bank: any) => {
                  console.log("Enter bank loop ");
                  if (child_realdata.bank == bank.account) {
                    console.log("equal bank");
                    child_realdata["bank_id"] = bank.id;
                    child_realdata["id"] = uuid.v4();
                    child_realdata["payment_type"] = "bank";
                    isBank = 1;
                  }
                });
              }
              console.log("isBank ", isBank);
              console.log("child data ", child_realdata);
              if (isBank == 0) {
                child_realdata["bank_id"] = "";
                child_realdata["id"] = uuid.v4();
                child_realdata["payment_type"] = "cash";
              }
              child_realdata["type"] = "usage_showroom";
              delete(child_realdata.bank);
              payment_arr.push(child_realdata);
            }
            return RestApi.getDb("daily_cash_type").select();
          })
          .then((result) => {
            const types = result;
            for (const key in data) {
              const value = data[key];
              const realdata = comfunc.fillDefaultFields(value);
              types.forEach((type) => {
                if (type.code == realdata.cash_type) {
                  const id = realdata.id;
                  realdata.id = uuid.v4();
                  realdata.date = Utils.toSqlDate(realdata.date);
                  realdata["daily_cash_type_id"] = type.id;
                  let bank_amount = 0;
                  let cash_amount = 0;
                  let total_amount = 0;
                  payment_arr.forEach((payment: any) => {
                    if (payment.cash_id == id) {
                      if (payment.payment_type == "cash") {
                        cash_amount += Number(payment.amount);
                      } else {
                        bank_amount += Number(payment.amount);
                      }
                      total_amount += Number(payment.amount);
                      payment.cash_id = realdata.id;
                    }
                  });
                  realdata["bank_amount"] = bank_amount;
                  realdata["cash_amount"] = cash_amount;
                  realdata["total_amount"] = total_amount;
                  console.log("realdata ", realdata);
                  delete(realdata.cash_type);
                  daily_usage_arr.push(realdata);
                  let cash: any = {};
                  cash.id = uuid.v4();
                  cash.date = Utils.toSqlDate(new Date());
                  cash.type_id = realdata.id;
                  cash.cash_out = total_amount;
                  cash.status = "daily_usage_showroom";
                  cash.type = "daily_usage_showroom";
                  cash.user_id = 1;
                  cash = comfunc.fillDefaultFields(cash);
                  cash_arr.push(cash);
                }
              });
            }
            console.log("daily_cash_payment ", payment_arr);
            console.log("daily_usage ", daily_usage_arr);
            console.log("cash arr ", cash_arr);
            query.push(RestApi.getKnex().batchInsert("daily_cash", cash_arr));
            query.push(RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr));
            query.push(RestApi.getKnex().batchInsert("daily_usage_showroom", daily_usage_arr));
            return Promise.all(query);
          })
          .then((result) => {
            // res.json({ "success": result });
            // res.render("dashboard/bundle", params);
          })
          .catch((err) => {
            console.log("err in importing daily cash ", `${err}`);
            // res.json({ "error": err });
          });
      }
    });
    form.on("error", function (err) {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("end", function () {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "success", "files": uploads }));
    });
    form.parse(req);
  }

  public delete(req: IncomingMessage, res: ServerResponse, next: Function) {
    const file = (<any>req).body.file;
    if (typeof file === "string" && file != "") {
      const filePath = pathModule.join(this.publicDir, file);
      console.log(`DELETE ${file}`);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          let msg: any = { "message": "success", "file": file };
          if (err) {
            msg = { "message": "error", "file": file, "error": err.message };
          }
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(msg));
        });
      } else {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ "message": "error", "file": file, "error": "File not found!" }));
      }
    } else {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ "message": "error", "file": file, "error": "File not found!" }));
    }
  }

  public stream(req: IncomingMessage, res: ServerResponse, next: Function) {
    const reqData = (req.method == "POST") ? (<any>req).body : (<any>req).query;
    const file = reqData.file;
    if (typeof file === "string" && file != "") {
      const filePath = pathModule.join(this.publicDir, file);
      console.log(`STREAM ${file}`);
      if (fs.existsSync(filePath)) {
        const ms = new mediaserver.MediaServer();
        ms.pipe(req, res, filePath);
      } else {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ "message": "error", "file": file, "error": "File not found!" }));
      }
    } else {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ "message": "error", "file": file, "error": "File not found!" }));
    }
  }
}

export default new FileRouter();