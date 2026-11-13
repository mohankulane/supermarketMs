function Table({ heads, rows }) {
  return (
    <section className="box table">
      <table>
        <thead>
          <tr>
            {heads.map((x) => (
              <th>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((x) => (
                <td>{x}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Table;
