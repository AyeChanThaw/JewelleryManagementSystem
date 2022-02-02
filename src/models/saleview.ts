/**
 * Sale View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import * as comfunc from "../lib/comfunc";
import { Utils } from "../lib/utils";
import uuid from "uuid";

export class SaleView {
    constructor() { }

    public index(args: any, cb: Function) {
        const data: any = {
        data: []
        };

        RestApi.getDb("sale")
            .select()
            .then((result) => {
                cb(undefined, result);
            })
            .catch((err) => {
                cb(undefined, err);
            });

    }

    public confirmSale(args: any, cb: Function) {
      const items: any = [];
      const date = Utils.toSqlDate(new Date());
      let total_amount = 0;
      RestApi.getDb("cart")
        .where({"sale_person_id": args.sale_person_id, "is_sale": 0})
        .update({"customer_id": args.customer_id, "is_sale": 1, "sale_date": date})
        .then((result) => {
          return RestApi.getDb("cart")
                  .leftJoin("item", "item_id", "item.id")
                  .leftJoin("customer", "customer_id", "customer.id")
                  .where({"sale_person_id": args.sale_person_id, "cart.is_sale": 1})
                  .select("cart.*", "item.item_name", "customer.customer_name");
        })
        .then((result) => {
          console.log("result ", result);
          if (result && result.length > 0) {
            console.log("enter if");
            result.forEach((cart: any) => {
              total_amount += Number(cart.price);
              let item: any = {
                item_id: cart.item_id,
                item_name: cart.item_name,
                price: cart.price
              }
              items.push(item);
            });
            let data: any = {
              id: "",
              date: date,
              voc_no: "",
              total_amount: total_amount,
              subtotal: total_amount,
              debt_amount: 0,
              cash_amount: 0,
              bank_amount: 0,
              discount_amount: 0,
              customer_name: result[0].customer_name,
              type: result[0].type,
              bank_name: ""
            }
            console.log("data ", data);
            cb(undefined, {
              success: true,
              data: data,
              items: items
            }); 
          } else {
            throw new Error("No Cart with this sale person.");
          }
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Cart confirm error"
            }
          });
        });
    }

    public confirmSaleOld(args: any, cb: Function) {
      const sale_diamond_items: any = [];
      const sale_gold_items: any = [];
      const sale_gold: any = {};
      const sale_diamond: any = {};
      const query: any = [];
      let return_data: any = {};
      const date = Utils.toSqlDate(new Date());
      const datecode = Utils.toGeneratecodeDate(new Date());
      let total_amount = 0;
      let prefix = "";
      let count = 0;
      let type = "";
      RestApi.getDb("cart")
        .where("sale_person_id", args.sale_person_id)
        .select()
        .then((result) => {
          if (result && result.length > 0) {
            if (result[0].type == "gold") {
              prefix = "SG";
              type = "gold";
              sale_gold.id = uuid.v4();
              sale_gold.date = date;
              sale_gold.sale_person_id = args.sale_person_id;
              sale_gold.customer_id = args.customer_id;
              sale_gold.is_order = 0;
              sale_gold.order_amount = 0;
              sale_gold.discount_amount = 0;
              sale_gold.is_active = 1;
              sale_gold.is_debt = 0;
              sale_gold.debt_amount = 0;
              sale_gold.createddate = date;
              sale_gold.updateddate = date;
            } else {
              prefix = "SD";
              type = "diamond";
              sale_diamond.id = uuid.v4();
              sale_diamond.date = date;
              sale_diamond.sale_person_id = args.sale_person_id;
              sale_diamond.customer_id = args.customer_id;
              sale_diamond.current_rate = 0;
              sale_diamond.is_order = 0;
              sale_diamond.order_total_amount = 0;
              sale_diamond.discount_amount = 0;
              sale_diamond.is_change = 0;
              sale_diamond.change_total_amount = 0;
              // sale_diamond.change_percentage = 0;
              // sale_diamond.change_profit = 0;
              sale_diamond.profit_percentage = 0;
              sale_diamond.profit_amount = 0;
              sale_diamond.is_active = 1;
              sale_diamond.is_debt = 0;
              sale_diamond.debt_amount = 0;
              sale_diamond.createddate = date;
              sale_diamond.updateddate = date;
            }
            result.forEach((cart: any) => {
              total_amount += cart.price;
              if (cart.type == "gold") {
                const item: any = {
                  id: uuid.v4(),
                  sale_gold_id: sale_gold.id,
                  item_id: cart.item_id,
                  image: cart.image,
                  wgt_gm: cart.wgt_gm,
                  wgt_k: cart.wgt_k,
                  wgt_p: cart.wgt_p,
                  wgt_y: cart.wgt_y,
                  goldrate: cart.goldrate,
                  current_rate: cart.current_rate,
                  price: cart.price,
                  status: "",
                  createddate: date,
                  updateddate: date
                }
                sale_gold_items.push(item);
              } else {
                const item: any = {
                  id: uuid.v4(),
                  sale_diamond_id: sale_diamond.id,
                  item_id: cart.item_id,
                  image: cart.image,
                  wgt_gm: cart.wgt_gm,
                  diamond_qty: cart.diamond_qty,
                  // goldrate: cart.goldrate,
                  price: cart.price,
                  status: "",
                  createddate: date,
                  updateddate: date
                }
                sale_diamond_items.push(item);
                if (cart.type == "pt") {
                  sale_diamond.current_rate = cart.current_rate;
                }
              }
              query.push(RestApi.getDb("item").where("id", cart.item_id).update({"is_sale": 1, "is_cart": 0, "sale_date": Utils.toSqlDate(new Date()), "updateddate": Utils.toSqlDate(new Date())}));
            });
            if (result[0].type == "gold") {
              sale_gold.total_amount = total_amount;
              sale_gold.subtotal = total_amount;
            } else {
              sale_diamond.total_amount = total_amount;
              sale_diamond.subtotal = total_amount;
            }
            return RestApi.getDb("autogenerate").where("prefix", prefix).select();
          } else {
            throw new Error("No Cart with this sale person.");
          }
        })
        .then((result) => {
          if (result[0].lastdate == datecode) {
            count = result[0].currentvalue + 1;
          } else {
            count++;
            result[0].lastdate = datecode;
          }
          const code = prefix + datecode + count;
          if (type == "gold")
            sale_gold.voc_no = code;
          else
            sale_diamond.voc_no = code;
          query.push(RestApi.getDb("autogenerate").where("prefix", prefix).update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id"));
          query.push(RestApi.getDb("cart").where("sale_person_id", args.sale_person_id).delete());
          if (type == "gold") {
            query.push(RestApi.getDb("sale_gold").insert(sale_gold, "id"));
            query.push(RestApi.getKnex().batchInsert("sale_gold_items", sale_gold_items));
          } else {
            query.push(RestApi.getDb("sale_diamond").insert(sale_diamond, "id"));
            query.push(RestApi.getKnex().batchInsert("sale_diamond_items", sale_diamond_items));
          }
          return RestApi.getKnex().transaction(function (trx) {
                    Promise.all(query)
                      .then(trx.commit)
                      .catch(trx.rollback);
                  }) as PromiseLike<any>;
        })
        .then((result) => {
          if (type == "gold") {
            return_data.id = sale_gold.id;
            return_data.type = "gold";
          } else {
            return_data.id = sale_diamond.id;
            return_data.type = "diamond";
          }
          cb(undefined, {
            success: true,
            data: return_data
          });
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Cart confirm error"
            }
          });
        });
    }

    public buyNowDiamond(args: any, cb: Function) {
      const sale_items: any = [];
      let data = args.data;
      const date = Utils.toSqlDate(new Date());
      data = comfunc.fillDefaultFields(data);
      const type = data.type;
      const query: any = [];
      query.push(RestApi.getDb("item").where("id", data.item_id).update({"is_stock": 0, "is_sale": 1, "sale_date": date, "updateddate": date}));
      let sale: any = {
        id: uuid.v4(),
        date: date,
        voc_no: "",
        sale_person_id: data.sale_person_id,
        customer_id: data.customer_id,
        current_rate: data.current_rate,
        total_amount: data.price,
        order_amount: 0,
        discount_amount: 0,
        subtotal: data.price,
        is_active: 1
      }
      sale = comfunc.fillDefaultFields(sale);
      RestApi.getDb("autogenerate").select("*").where("prefix", "SD")
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
          sale.voc_no = "SD" + datecode + count;
          result[0].currentvalue = count;
          result[0].lastdate = Utils.toGeneratecodeDate(new Date());
          result[0].updateddate = Utils.toSqlDate(new Date());
          autogenresult = result[0];
          delete (result[0].id);
          query.push(RestApi.getDb("sale_diamond").insert(sale, "id"));
          data.id = uuid.v4();
          data.sale_diamond_id = sale.id;
          // delete (data.user_id);
          delete (data.customer_id);
          delete (data.sale_person_id);
          delete (data.current_rate);
          query.push(RestApi.getDb("sale_diamond_items").insert(data, "id"));

          // if (result[0].lastdate == datecode) {
            return RestApi.getDb("autogenerate").where("prefix", "SD").update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id") as PromiseLike<any>;
          // }
        })
        .then((result) => {
          return RestApi.getKnex().transaction(function (trx) {
            Promise.all(query)
              .then(trx.commit)
              .catch(trx.rollback);
          }) as PromiseLike<any>;
        })
        .then((result) => {
          cb(undefined, {
            success: true,
            data: {
              id: sale.id,
              type: "diamond"
            }
          });
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Buy now diamond error"
            }
          });
        });
    }

    public buyNowGold(args: any, cb: Function) {
      const sale_items: any = [];
      let data = args.data;
      const date = Utils.toSqlDate(new Date());
      data = comfunc.fillDefaultFields(data);
      const type = data.type;
      const query: any = [];
      query.push(RestApi.getDb("item").where("id", data.item_id).update({"is_stock": 0, "is_sale": 1, "sale_date": date, "updateddate": date}));
      let sale: any = {
        id: uuid.v4(),
        date: date,
        voc_no: "",
        sale_person_id: data.sale_person_id,
        customer_id: data.customer_id,
        total_amount: data.price,
        order_amount: 0,
        discount_amount: 0,
        subtotal: data.price,
        is_active: 1
      }
      sale = comfunc.fillDefaultFields(sale);
      RestApi.getDb("autogenerate").select("*").where("prefix", "SG")
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
          sale.voc_no = "SG" + datecode + count;
          result[0].currentvalue = count;
          result[0].lastdate = Utils.toGeneratecodeDate(new Date());
          result[0].updateddate = Utils.toSqlDate(new Date());
          autogenresult = result[0];
          delete (result[0].id);
          query.push(RestApi.getDb("sale_gold").insert(sale, "id"));
          // delete (data.user_id);
          delete (data.customer_id);
          delete (data.sale_person_id);
          delete (data.type);
          data.id = uuid.v4();
          data.sale_gold_id = sale.id;
          query.push(RestApi.getDb("sale_gold_items").insert(data, "id"));

          // if (result[0].lastdate == datecode) {
            return RestApi.getDb("autogenerate").where("prefix", "SG").update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id") as PromiseLike<any>;
          // }
        })
        .then((result) => {
          return RestApi.getKnex().transaction(function (trx) {
            Promise.all(query)
              .then(trx.commit)
              .catch(trx.rollback);
          }) as PromiseLike<any>;
        })
        .then((result) => {
          cb(undefined, {
            success: true,
            data: {
              id: sale.id,
              type: "gold"
            }
          });
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Buy now gold error"
            }
          });
        });
    }

    public payment(args: any, cb: Function) {
      const sale_diamond_items: any = [];
      const sale_gold_items: any = [];
      const sale_gold: any = {};
      const sale_diamond: any = {};
      const query: any = [];
      let return_data: any = {};
      let payment_arr: any = [];
      const items: any = [];
      const date = Utils.toSqlDate(new Date());
      const datecode = Utils.toGeneratecodeDate(new Date());
      let total_amount = 0;
      let payamount = 0;
      let prefix = "";
      let count = 0;
      let type = "";
      const id: any = uuid.v4();
      RestApi.getDb("cart")
        .leftJoin("item", "item_id", "item.id")
        .leftJoin("customer", "customer_id", "customer.id")
        .where({"sale_person_id": args.sale_person_id, "cart.is_sale": 1})
        .select("cart.*", "item.item_name", "customer.customer_name")
        .then((result) => {
          if (result && result.length > 0) {
            result.forEach((cart) => {
              total_amount += Number(cart.price);
              if (cart.type == "gold") {
                const item: any = {
                  id: uuid.v4(),
                  sale_gold_id: id,
                  item_id: cart.item_id,
                  image: cart.image,
                  wgt_gm: cart.wgt_gm,
                  wgt_k: cart.wgt_k,
                  wgt_p: cart.wgt_p,
                  wgt_y: cart.wgt_y,
                  goldrate: cart.goldrate,
                  current_rate: cart.current_rate,
                  price: cart.price,
                  status: "",
                  createddate: date,
                  updateddate: date
                }
                sale_gold_items.push(item);
              } else {
                const item: any = {
                  id: uuid.v4(),
                  sale_diamond_id: id,
                  item_id: cart.item_id,
                  image: cart.image,
                  wgt_gm: cart.wgt_gm,
                  diamond_qty: cart.diamond_qty,
                  price: cart.price,
                  status: "",
                  createddate: date,
                  updateddate: date
                }
                sale_diamond_items.push(item);
                if (cart.type == "pt") {
                  sale_diamond.current_rate = cart.current_rate;
                }
              }
              query.push(RestApi.getDb("item").where("id", cart.item_id).update({"is_sale": 1, "is_cart": 0, "sale_date": cart.sale_date, "updateddate": date}));
              let item: any = {
                item_name: cart.item_name,
                price: cart.price
              }
              items.push(item);
            });
            const pay_amount = Number(total_amount) - (Number(args.discount_amount) + Number(args.debt_amount));
            if (result[0].type == "gold") {
              prefix = "SG";
              type = "gold";
              sale_gold.id = id;
              sale_gold.date = result[0].date;
              sale_gold.sale_person_id = args.sale_person_id;
              sale_gold.customer_id = result[0].customer_id;
              sale_gold.is_order = 0;
              sale_gold.order_total_amount = 0;
              sale_gold.discount_amount = args.discount_amount;
              sale_gold.total_amount = total_amount;
              sale_gold.subtotal = Number(total_amount) - Number(args.discount_amount);
              sale_gold.is_active = 1;
              sale_gold.is_debt = args.debt_amount > 0 ? 1 : 0;
              sale_gold.debt_amount = args.debt_amount;
              sale_gold.bank_amount = args.bank_amount;
              sale_gold.cash_amount = args.cash_amount;
              sale_gold.pay_amount = pay_amount;
              sale_gold.createddate = date;
              sale_gold.updateddate = date;
            } else {
              prefix = "SD";
              type = "diamond";
              sale_diamond.id = id;
              sale_diamond.date = result[0].date;
              sale_diamond.sale_person_id = args.sale_person_id;
              sale_diamond.customer_id = result[0].customer_id;
              sale_diamond.current_rate = 0;
              sale_diamond.total_amount = total_amount;
              sale_diamond.subtotal = Number(total_amount) - Number(args.discount_amount);
              sale_diamond.profit_percentage = 0;
              sale_diamond.profit_amount = 0;
              sale_diamond.is_order = 0;
              sale_diamond.order_total_amount = 0;
              sale_diamond.discount_amount = args.discount_amount;
              sale_diamond.is_change = 0;
              sale_diamond.change_total_amount = 0;
              sale_diamond.is_active = 1;
              sale_diamond.is_debt = args.debt_amount > 0 ? 1 : 0;
              sale_diamond.debt_amount = args.debt_amount;
              sale_diamond.bank_amount = args.bank_amount;
              sale_diamond.cash_amount = args.cash_amount;
              sale_diamond.pay_amount = pay_amount;
              sale_diamond.createddate = date;
              sale_diamond.updateddate = date;
            }
            if (result[0].type == "gold") {
              sale_gold.total_amount = total_amount;
              sale_gold.subtotal = total_amount;
            } else {
              sale_diamond.total_amount = total_amount;
              sale_diamond.subtotal = total_amount;
            }

            return_data.id = id;
            return_data.date = date;
            return_data.voc_no = "";
            return_data.total_amount = total_amount;
            return_data.subtotal = Number(total_amount) - Number(args.discount_amount);
            return_data.debt_amount = 0;
            return_data.cash_amount = 0;
            return_data.bank_amount = 0;
            return_data.discount_amount = 0;
            return_data.customer_name = result[0].customer_name;
            return_data.type = result[0].type;
            return_data.bank_name = "";
            return_data.items = items;
            
            // payment
            payamount = Number(args.bank_amount) + Number(args.cash_amount);
            if (args.debt_amount > 0) {
              let customer_debt: any = {
                id: uuid.v4(),
                date: Utils.toSqlDate(new Date()),
                customer_id: result[0].customer_id,
                sale_diamond_id: "",
                sale_gold_id: "",
                amount: args.debt_amount,
                balance: args.debt_amount
              }
              if (type == "diamond")
                customer_debt.sale_diamond_id = id;
              else
                customer_debt.sale_gold_id = id;
              customer_debt = comfunc.fillDefaultFields(customer_debt);
              query.push(RestApi.getDb("customer_debt").insert(customer_debt, "id"));
            }
            let daily_cash: any = {
              id: uuid.v4(),
              date: Utils.toSqlDate(new Date()),
              type_id: id,
              cash_in: payamount,
              status: "sale",
              type: "",
              sale_person_id: args.sale_person_id
            }
            if (type == "diamond") {
              daily_cash.type = "sale_diamond";
              if (payamount > 0) {
                if (args.bank_amount > 0) {
                  let diamond_payment: any = {
                    id: uuid.v4(),
                    sale_diamond_id: id,
                    payment_type: "bank",
                    bank_id: args.bank_id,
                    amount: args.bank_amount,
                    is_delete: 0
                  }
                  diamond_payment = comfunc.fillDefaultFields(diamond_payment);
                  payment_arr.push(diamond_payment);
                }
                if (args.cash_amount > 0) {
                  let diamond_payment: any = {
                    id: uuid.v4(),
                    sale_diamond_id: id,
                    payment_type: "cash",
                    amount: args.cash_amount,
                    is_delete: 0
                  }
                  diamond_payment = comfunc.fillDefaultFields(diamond_payment);
                  payment_arr.push(diamond_payment);
                }
                query.push(RestApi.getKnex().batchInsert("sale_diamond_payment", payment_arr));
              }
            } else {
              daily_cash.type = "sale_gold";
              if (payamount > 0) {
                if (args.bank_amount > 0) {
                  let gold_payment: any = {
                    id: uuid.v4(),
                    sale_diamond_id: id,
                    payment_type: "bank",
                    bank_id: args.bank_id,
                    amount: args.bank_amount,
                    is_delete: 0
                  }
                  gold_payment = comfunc.fillDefaultFields(gold_payment);
                  payment_arr.push(gold_payment);
                }
                if (args.cash_amount > 0) {
                  let gold_payment: any = {
                    id: uuid.v4(),
                    sale_diamond_id: id,
                    payment_type: "cash",
                    amount: args.cash_amount,
                    is_delete: 0
                  }
                  gold_payment = comfunc.fillDefaultFields(gold_payment);
                  payment_arr.push(gold_payment);
                }
                query.push(RestApi.getKnex().batchInsert("sale_gold_payment", payment_arr));
              }
            }
            daily_cash = comfunc.fillDefaultFields(daily_cash);
            query.push(RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id"));

            return RestApi.getDb("autogenerate").where("prefix", prefix).select();
          } else {
            throw new Error("No Cart with this sale person.");
          }
        })
        .then((result) => {
          if (result[0].lastdate == datecode) {
            count = result[0].currentvalue + 1;
          } else {
            count++;
            result[0].lastdate = datecode;
          }
          const code = prefix + datecode + count;
          return_data.voc_nod = code;
          if (type == "gold")
            sale_gold.voc_no = code;
          else
            sale_diamond.voc_no = code;
          query.push(RestApi.getDb("autogenerate").where("prefix", prefix).update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id"));
          query.push(RestApi.getDb("cart").where({"sale_person_id": args.sale_person_id, "is_sale": 1}).delete());
          if (type == "gold") {
            query.push(RestApi.getDb("sale_gold").insert(sale_gold, "id"));
            query.push(RestApi.getKnex().batchInsert("sale_gold_items", sale_gold_items));
          } else {
            query.push(RestApi.getDb("sale_diamond").insert(sale_diamond, "id"));
            query.push(RestApi.getKnex().batchInsert("sale_diamond_items", sale_diamond_items));
          }
          return RestApi.getKnex().transaction(function (trx) {
                    Promise.all(query)
                      .then(trx.commit)
                      .catch(trx.rollback);
                  }) as PromiseLike<any>;
        })
        .then((result) => {
          return RestApi.getDb("bank").where("id", args.bank_id).select().first();
        })
        .then((result) => {
          if (result)
            return_data.bank_name = result.bank_name;
          cb(undefined, {
            success: true,
            id: id
            // data: return_data
          });
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Cart confirm error"
            }
          });
        });
    }

    public paymentOld(args: any, cb: Function) {
      let db;
      const type = args.type;
      if (type == "diamond") {
        db = RestApi.getDb("sale_diamond");
      } else {
        db = RestApi.getDb("sale_gold");
      }
      const query: any = [];
      const payment_arr: any = [];
      let payamount: any = 0;
      db.where("id", args.sale_id)
        .select()
        .first()
        .then((result) => {
          const sale = result;
          sale.discount_amount = args.discount_amount == "" ? 0.00 : args.discount_amount;
          sale.subtotal = Number(sale.total_amount) - Number(args.discount_amount);
          sale.bank_amount = args.bank_amount;
          sale.cash_amount = args.cash_amount;
          payamount = Number(sale.bank_amount) + Number(sale.cash_amount);
          if (args.debt_amount > 0) {
            sale.is_debt = 1;
            sale.debt_amount = args.debt_amount;
            let customer_debt: any = {
              id: uuid.v4(),
              date: Utils.toSqlDate(new Date()),
              customer_id: sale.customer_id,
              sale_diamond_id: "",
              sale_gold_id: "",
              amount: args.debt_amount,
              balance: args.debt_amount
            }
            if (type == "diamond")
              customer_debt.sale_diamond_id = args.sale_id;
            else
              customer_debt.sale_gold_id = args.sale_id;
            customer_debt = comfunc.fillDefaultFields(customer_debt);
            query.push(RestApi.getDb("customer_debt").insert(customer_debt, "id"));
          }
          sale.updateddate = Utils.toSqlDate(new Date());
          let daily_cash: any = {
            id: uuid.v4(),
            date: Utils.toSqlDate(new Date()),
            type_id: sale.id,
            cash_in: payamount,
            status: "sale",
            type: "",
            sale_person_id: sale.sale_person_id
          }
          if (type == "diamond") {
            daily_cash.type = "sale_diamond";
            query.push(RestApi.getDb("sale_diamond").where("id", args.sale_id).update(sale, "id"));
            if (payamount > 0) {
              if (sale.bank_amount > 0) {
                let diamond_payment: any = {
                  id: uuid.v4(),
                  sale_diamond_id: args.sale_id,
                  payment_type: "bank",
                  bank_id: args.bank_id,
                  amount: sale.bank_amount,
                  is_delete: 0
                }
                diamond_payment = comfunc.fillDefaultFields(diamond_payment);
                payment_arr.push(diamond_payment);
              }
              if (sale.cash_amount > 0) {
                let diamond_payment: any = {
                  id: uuid.v4(),
                  sale_diamond_id: args.sale_id,
                  payment_type: "cash",
                  amount: sale.cash_amount,
                  is_delete: 0
                }
                diamond_payment = comfunc.fillDefaultFields(diamond_payment);
                payment_arr.push(diamond_payment);
              }
              query.push(RestApi.getKnex().batchInsert("sale_diamond_payment", payment_arr));
              // query.push(RestApi.getDb("sale_diamond_payment").insert(diamond_payment, "id"));
            }
          } else {
            daily_cash.type = "sale_gold";
            query.push(RestApi.getDb("sale_gold").where("id", args.sale_id).update(sale, "id"));
            if (payamount > 0) {
              if (sale.bank_amount > 0) {
                let diamond_payment: any = {
                  id: uuid.v4(),
                  sale_diamond_id: args.sale_id,
                  payment_type: "bank",
                  bank_id: args.bank_id,
                  amount: sale.bank_amount,
                  is_delete: 0
                }
                diamond_payment = comfunc.fillDefaultFields(diamond_payment);
                payment_arr.push(diamond_payment);
              }
              if (sale.cash_amount > 0) {
                let diamond_payment: any = {
                  id: uuid.v4(),
                  sale_diamond_id: args.sale_id,
                  payment_type: "cash",
                  amount: sale.cash_amount,
                  is_delete: 0
                }
                diamond_payment = comfunc.fillDefaultFields(diamond_payment);
                payment_arr.push(diamond_payment);
              }
              query.push(RestApi.getKnex().batchInsert("sale_diamond_payment", payment_arr));
            }
          }
          daily_cash = comfunc.fillDefaultFields(daily_cash);
          query.push(RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id"));
          return RestApi.getKnex().transaction(function (trx) {
            Promise.all(query)
              .then(trx.commit)
              .catch(trx.rollback);
          }) as PromiseLike<any>;
        })
        .then((result) => {
          cb(undefined, {
            success: true
          });
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Payment error"
            }
          });
        });
    }

    public getSale(args: any, cb: Function) {
      let db;
      const type = args.type;
      let data:any = {};
      if (type == "diamond") {
        db = RestApi.getDb("sale_diamond")
              .leftJoin("customer", "sale_diamond.customer_id", "customer.id")
              .where("sale_diamond.id", args.sale_id)
              .select("sale_diamond.id", "date", "voc_no", "total_amount", "subtotal", "debt_amount", "cash_amount", "bank_amount", "discount_amount", "customer.customer_name");
      } else {
        db = RestApi.getDb("sale_gold")
              .leftJoin("customer", "sale_gold.customer_id", "customer.id")
              .where("sale_gold.id", args.sale_id)
              .select("sale_gold.id", "date", "voc_no", "total_amount", "subtotal", "debt_amount", "cash_amount", "bank_amount", "discount_amount", "customer.customer_name");
      }
      db.first()
        .then((result) => {
          data = result;
          if (type == "diamond") {
            data.type = "diamond";
            return RestApi.getDb("sale_diamond_payment").leftJoin("bank", "sale_diamond_payment.bank_id", "bank.id").where("sale_diamond_id", args.sale_id).select("bank.bank_name").first();
          } else {
            data.type = "gold";
            return RestApi.getDb("sale_gold_payment").leftJoin("bank", "sale_gold_payment.bank_id", "bank.id").where("sale_gold_id", args.sale_id).select("bank.bank_name").first();
          }
        })
        .then((result) => {
          if (result && result != "") {
            data.bank_name = result.bank_name;
          } else {
            data.bank_name = "";
          }
          if (type == "diamond") {
            return RestApi.getDb("sale_diamond_items").leftJoin("item", "item_id", "item.id").where("sale_diamond_id", args.sale_id).select("sale_diamond_items.item_id", "item.item_name", "sale_diamond_items.price")
          } else {
            return RestApi.getDb("sale_gold_items").leftJoin("item", "item_id", "item.id").where("sale_gold_id", args.sale_id).select("sale_gold_items.item_id", "item.item_name", "sale_gold_items.price")
          }
        })
        .then((result) => {
          cb(undefined, {
            success: true,
            data: data,
            items: result
          });
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Get Sale Error"
            }
          });
        });
    }

    public getSaleDiamondItemByCustomer(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "item_name": "[Select One]"
      }];
      RestApi.getDb("sale_diamond_items")
        .leftJoin("sale_diamond", "sale_diamond_id", "sale_diamond.id")
        .leftJoin("item", "item_id", "item.id")
        .whereNull("sale_diamond_items.status")
        // .whereNotIn("sale_diamond_items.status", ["return", "change"])
        .andWhere("sale_diamond_items.is_delete", 0)
        .andWhere("sale_diamond.customer_id", args.customer_id)
        // .where({"sale_diamond.customer_id": args.customer_id, "sale_diamond_items.status": ""})
        .select("sale_diamond_items.item_id as id", "item.item_name")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
            cb(undefined, data);
          }
        });
    }

    public getSaleGoldItemByCustomer(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "item_name": "[Select One]"
      }];
      RestApi.getDb("sale_gold_items")
        .leftJoin("sale_gold", "sale_gold_id", "sale_gold.id")
        .leftJoin("item", "item_id", "item.id")
        .whereNull("sale_gold_items.status")
        .andWhere("sale_gold.customer_id", args.customer_id)
        // .where({"sale_gold.customer_id": args.customer_id, "sale_gold_items.status": ""})
        .andWhere("sale_gold_items.is_delete", 0)
        .select("sale_gold_items.item_id as id", "item.item_name")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
            cb(undefined, data);
          }
        });
    }

    public getSaleDiamondItem(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "item_name": "[Select One]",
      }];
      RestApi.getDb("sale_diamond_items")
        .leftJoin("item", "item_id", "item.id")
        .where({"sale_diamond_id": args.id, "sale_diamond_items.status": ""})
        .select("item.id", "item.item_name")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Sale Diamond Item Error."
            }
          });
        });
    }

    public getSaleGoldItem(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "item_name": "[Select One]",
      }];
      RestApi.getDb("sale_gold_items")
        .leftJoin("item", "item_id", "item.id")
        .where({"sale_gold_id": args.id, "sale_gold_items.status": ""})
        .select("item.id", "item.item_name")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Sale Gold Item Error."
            }
          });
        });
    }

    public getOrderDiamondByCustomer(args: any, cb: Function) {
      const data: any = [{
        "order_diamond_id": "",
        "order_voc_no": "[Select One]"
      }];
      RestApi.getDb("order_diamond")
        .where({"customer_id": args.customer_id, "is_active": 1})
        // .orWhere("id", args.id)
        .select("id as order_diamond_id", "voc_no as order_voc_no")
        .then((result) => {
         if (result.length > 0) {
            result.forEach((order) => {
              data.push(order);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Order Error."
            }
          });
        });

    }

    public getOrderGoldByCustomer(args: any, cb: Function) {
      const data: any = [{
        "order_gold_id": "",
        "order_voc_no": "[Select One]"
      }];
      RestApi.getDb("order_gold")
        .where({"customer_id": args.customer_id, "is_active": 1})
        // .orWhere("id", args.id)
        .select("id as order_gold_id", "voc_no as order_voc_no")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((order) => {
              data.push(order);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Order Error."
            }
          });
        });

    }

    public getChangeByCustomer(args: any, cb: Function) {
      const data: any = [{
        "change_diamond_id": "",
        "change_voc_no": "[Select One]"
      }];
      RestApi.getDb("change_diamond")
        .where({"customer_id": args.customer_id, "is_active": 1})
        // .orWhere("id", args.id)
        .select("id as change_diamond_id", "voc_no as change_voc_no")
        .then((result) => {
          // const changes: any = [];
          // if (result.length > 0) {
          //   result.forEach((ret) => {
          //     changes.push({label: ret.voc_no, value: ret.id});
          //   });
          // }
          // cb(undefined, changes);
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Order Error."
            }
          });
        });
    }

    public getAmtByOrderDiamondId(args: any, cb: Function) {
      RestApi.getDb("order_diamond")
        .where("id", args.order_diamond_id)
        .select()
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Order Error."
            }
          });
        });
    }

    public getAmtByOrderGoldId(args: any, cb: Function) {
      RestApi.getDb("order_gold")
        .where("id", args.order_gold_id)
        .select()
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Order Error."
            }
          });
        });
    }

    public getAmtByChangeId(args: any, cb: Function) {
      RestApi.getDb("change_diamond")
        .where("id", args.change_diamond_id)
        .select()
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Change Error."
            }
          });
        });
    }

    public getCurrentRateByGoldrate(args: any, cb: Function) {
      RestApi.getDb("goldrate_price")
        .orderBy("createddate", "desc")
        .select()
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Goldrate Error."
            }
          });
        });
    }
}

export default new SaleView();