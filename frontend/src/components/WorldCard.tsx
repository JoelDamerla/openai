type WorldCardProps = {
  data: {
    name?: string;
    type?: string;
    description?: string;
    abilities?: any[]; 
    image?: string;
  };
};
 
function WorldCard({ data }: WorldCardProps) {
  const abilities: string[] = Array.isArray(data.abilities)
    ? data.abilities.map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    : [];
  return (
<div className="world-card">
      {data.name && <h2>{data.name}</h2>}
      {data.type && (
<p>
<strong>Type:</strong> {data.type}
</p>
      )}
      {data.description && <p>{data.description}</p>}
      {abilities.length > 0 && (
<ul>
          {abilities.map((ability, i) => (
<li key={i}>{ability}</li>
          ))}
</ul>
      )}
      {data.image && (
<div className="world-image">
<img
            src={data.image}
            alt={data.name}
            style={{
              maxWidth: "300px",
              maxHeight: "300px",
              objectFit: "cover",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              marginTop: "10px",
            }}
          />
</div>
      )}
</div>
  );
}
 
export default WorldCard;

 