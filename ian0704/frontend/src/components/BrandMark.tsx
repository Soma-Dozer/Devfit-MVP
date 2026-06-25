export default function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg text-white font-black shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: "linear-gradient(135deg,#2ea043,#3fb950)",
      }}
    >
      ◧
    </span>
  );
}
