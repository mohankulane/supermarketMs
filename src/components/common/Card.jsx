function Card({ t, v, c }) {
  return (
    <div className={"big-card " + c}>
      <small>{t}</small>
      <b>
        {typeof v === "number" && t !== "Invoices" && t !== "Low stock"
          ? `$${v.toFixed(2)}`
          : v}
      </b>
    </div>
  );
}

export default Card;
