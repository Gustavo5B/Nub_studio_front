// src/components/ProductCard.tsx
import { Eye, Heart, Star } from "lucide-react";
import "../styles/products.css";

interface ProductCardProps {
  id: string;
  category: string;
  title: string;
  price: number;
  image: string;
  available: boolean;
  artistName?: string;
  onView?: (id: string) => void;
  onBuy?: (id: string) => void;
}

export default function ProductCard({
  id, category, title, price, image, available, artistName, onView, onBuy
}: ProductCardProps) {
  const fmt = (p: number) => `$${p.toLocaleString('es-MX')}`;

  return (
    <article className="mp-card" onClick={() => onView?.(id)}>
      {/* Imagen */}
      <div className="mp-img-wrap">
        <img
          src={image}
          alt={title}
          className="mp-img"
          onError={e => { e.currentTarget.src = 'https://via.placeholder.com/300x300/1a1a2e/ff8a5b?text=Sin+imagen'; }}
        />
        <button className="mp-wish" onClick={e => e.stopPropagation()}>
          <Heart size={16} />
        </button>
        {!available && <div className="mp-sold">Agotado</div>}
        <div className="mp-quick" onClick={e => { e.stopPropagation(); onView?.(id); }}>
          <Eye size={14} /> Vista rápida
        </div>
      </div>

      {/* Info */}
      <div className="mp-body">
        <span className="mp-cat">{category}</span>
        <h3 className="mp-title">{title}</h3>
        {artistName && <p className="mp-artist">por {artistName}</p>}

        <div className="mp-rating">
          <Star size={12} fill="#ffd60a" color="#ffd60a" />
          <Star size={12} fill="#ffd60a" color="#ffd60a" />
          <Star size={12} fill="#ffd60a" color="#ffd60a" />
          <Star size={12} fill="#ffd60a" color="#ffd60a" />
          <Star size={12} fill="#ffd60a" color="#ffd60a" />
          <span>4.8</span>
        </div>

        <div className="mp-price">{fmt(price)} <span>MXN</span></div>

        <button
          className="mp-btn"
          disabled={!available}
          onClick={e => { e.stopPropagation(); onBuy?.(id); }}
        >
          {available ? 'Ver obra' : 'No disponible'}
        </button>
      </div>
    </article>
  );
}