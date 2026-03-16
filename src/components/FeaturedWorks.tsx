// src/components/FeaturedWorks.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import { Sparkles, TrendingUp, Filter, RefreshCw } from "lucide-react";
import "../styles/products.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface Obra {
  id_obra: number;
  titulo: string;
  slug: string;
  imagen_principal: string;
  precio_base: number;
  precio_minimo: number;
  categoria_nombre: string;
  artista_nombre: string;
  artista_alias: string;
  estado: string;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
}

export default function FeaturedWorks() {
  const navigate = useNavigate();
  const [obras, setObras]           = useState<Obra[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catActiva, setCatActiva]   = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/categorias`)
      .then(r => r.json())
      .then(j => setCategorias(j.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "8", ordenar: "recientes" });
    if (catActiva) params.set("categoria", String(catActiva));

    fetch(`${API_URL}/api/obras?${params}`)
      .then(r => r.json())
      .then(j => setObras(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [catActiva]);

  const handleView = (id: string) => {
    const obra = obras.find(o => String(o.id_obra) === id);
    if (obra?.slug) navigate(`/obras/${obra.slug}`);
  };

  return (
    <section className="featured-section-premium">
      <div className="section-background">
        <div className="bg-gradient bg-gradient-1" />
        <div className="bg-gradient bg-gradient-2" />
      </div>

      <div className="container-premium">
        {/* Header */}
        <div className="section-header-premium">
          <div className="header-top">
            <div className="header-badge">
              <Sparkles size={16} />
              <span>Colección Exclusiva</span>
            </div>
            <button className="filter-btn" onClick={() => navigate("/catalogo")}>
              <Filter size={18} />
              <span>Ver todo</span>
            </button>
          </div>

          <h2 className="section-title-premium">
            Obras <span className="title-highlight">Destacadas</span>
          </h2>

          <p className="section-subtitle-premium">
            Selección curada de nuestras mejores piezas. Cada obra cuenta una
            historia única y preserva la esencia de nuestra cultura ancestral.
          </p>

          <div className="category-filters">
            <button
              className={`category-btn${catActiva === null ? " active" : ""}`}
              onClick={() => setCatActiva(null)}
            >
              Todas
            </button>
            {categorias.map(c => (
              <button
                key={c.id_categoria}
                className={`category-btn${catActiva === c.id_categoria ? " active" : ""}`}
                onClick={() => setCatActiva(c.id_categoria)}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mp-loading">
            <RefreshCw size={20} className="mp-spin" />
            <span>Cargando obras…</span>
          </div>
        ) : obras.length === 0 ? (
          <div className="mp-empty">No hay obras en esta categoría aún.</div>
        ) : (
          <div className="mp-grid">
            {obras.map(obra => (
              <ProductCard
                key={obra.id_obra}
                id={String(obra.id_obra)}
                category={obra.categoria_nombre || "Arte"}
                title={obra.titulo}
                price={Number(obra.precio_minimo || obra.precio_base) || 0}
                image={obra.imagen_principal || ""}
                available={obra.estado === "publicada"}
                artistName={obra.artista_alias || obra.artista_nombre}
                onView={handleView}
                onBuy={handleView}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="section-cta">
          <TrendingUp size={24} />
          <h3>¿Buscas algo específico?</h3>
          <p>Explora nuestra colección completa de obras disponibles</p>
          <button className="cta-btn-large" onClick={() => navigate("/catalogo")}>
            Ver Colección Completa
          </button>
        </div>
      </div>
    </section>
  );
}