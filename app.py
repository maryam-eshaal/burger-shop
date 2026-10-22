import json
from datetime import datetime
from pathlib import Path

import streamlit as st

from menu import CURRENCY, MENU, SHOP_NAME, TAX_RATE

ORDERS_FILE = Path(__file__).with_name("orders.json")
ITEMS = {item["id"]: item for group in MENU.values() for item in group}

st.set_page_config(page_title=SHOP_NAME, page_icon="🍔", layout="wide")


def money(amount):
    return f"{CURRENCY}{amount:,.2f}"


def save_order(order):
    orders = []
    if ORDERS_FILE.exists():
        try:
            orders = json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            orders = []
    order["number"] = len(orders) + 1
    orders.append(order)
    ORDERS_FILE.write_text(json.dumps(orders, indent=2, ensure_ascii=False), encoding="utf-8")
    return order["number"]


if "cart" not in st.session_state:
    st.session_state.cart = {}
if "placed" not in st.session_state:
    st.session_state.placed = None


def add_item(item_id):
    cart = st.session_state.cart
    cart[item_id] = cart.get(item_id, 0) + 1


def change_qty(item_id, delta):
    cart = st.session_state.cart
    cart[item_id] = cart.get(item_id, 0) + delta
    if cart[item_id] <= 0:
        del cart[item_id]


st.title(f"🍔 {SHOP_NAME}")
st.caption("Smashed to order. Ready in about 15 minutes.")

if st.session_state.placed:
    placed = st.session_state.placed
    st.success(f"Order placed. Thanks, {placed['name']}!")
    st.header(f"Order #{placed['number']}")
    st.write("Show this number at the counter.")
    if st.button("Start a new order"):
        st.session_state.placed = None
        st.rerun()
    st.stop()

cart = st.session_state.cart
menu_col, cart_col = st.columns([3, 2], gap="large")

with menu_col:
    tabs = st.tabs(list(MENU))
    for tab, (category, items) in zip(tabs, MENU.items()):
        with tab:
            for item in items:
                left, right = st.columns([4, 1])
                left.markdown(f"**{item['name']}** · {money(item['price'])}")
                left.caption(item["desc"])
                right.button("Add", key=f"add_{item['id']}",
                             on_click=add_item, args=(item["id"],))

with cart_col:
    st.subheader("Your order")
    if not cart:
        st.info("Nothing here yet. Add a burger to get started.")
    for item_id in list(cart):
        item = ITEMS[item_id]
        c1, c2, c3, c4 = st.columns([4, 2, 1, 1])
        c1.write(f"{item['name']} × {cart[item_id]}")
        c2.write(money(item["price"] * cart[item_id]))
        c3.button("−", key=f"dec_{item_id}", on_click=change_qty, args=(item_id, -1))
        c4.button("+", key=f"inc_{item_id}", on_click=change_qty, args=(item_id, 1))

    if cart:
        subtotal = sum(ITEMS[i]["price"] * q for i, q in cart.items())
        tax = round(subtotal * TAX_RATE, 2)
        total = subtotal + tax
        st.divider()
        st.write(f"Subtotal: {money(subtotal)}")
        st.write(f"Tax ({TAX_RATE:.0%}): {money(tax)}")
        st.markdown(f"### Total: {money(total)}")

        with st.form("checkout"):
            mode = st.radio("Order type", ["Pickup", "Delivery"], horizontal=True)
            name = st.text_input("Name")
            phone = st.text_input("Phone number")
            address = st.text_input("Delivery address (only for delivery)")
            notes = st.text_input("Notes for the kitchen (optional)")
            submitted = st.form_submit_button(f"Place order · {money(total)}")

        if submitted:
            if not name.strip():
                st.error("Enter your name so we can call it out.")
            elif sum(c.isdigit() for c in phone) < 7:
                st.error("Enter a phone number we can reach.")
            elif mode == "Delivery" and not address.strip():
                st.error("Enter a delivery address.")
            else:
                order = {
                    "time": datetime.now().isoformat(timespec="seconds"),
                    "type": mode,
                    "name": name.strip(),
                    "phone": phone.strip(),
                    "address": address.strip() if mode == "Delivery" else "",
                    "notes": notes.strip(),
                    "items": [{"name": ITEMS[i]["name"], "qty": q, "price": ITEMS[i]["price"]}
                              for i, q in cart.items()],
                    "total": round(total, 2),
                }
                number = save_order(order)
                st.session_state.placed = {"number": number, "name": order["name"]}
                st.session_state.cart = {}
                st.rerun()
