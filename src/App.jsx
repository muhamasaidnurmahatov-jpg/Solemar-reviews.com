import { useEffect, useState, useMemo } from "react";
import "./App.css";
import logo from "./assets/solemar logo.jpg";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY // Изменено название ключа
);

const RATING_LABELS = {
  1: "Очень плохо",
  2: "Плохо",
  3: "Нормально",
  4: "Хорошо",
  5: "Отлично!",
};

function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Пожалуйста, поставьте оценку");
      return;
    }

    if (!review.trim()) {
      alert("Пожалуйста, напишите отзыв");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("reviews").insert([
      {
        rating,
        review: review.trim(),
        name: name.trim() || "Гость",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Не удалось отправить отзыв");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <main className="page">
        <div className="card success-card">
          <img src={logo} className="logo" alt="Solemar" />

          <div className="success-icon">✓</div>

          <h1>Спасибо за отзыв!</h1>

          <p>
            Мы очень ценим ваше мнение.
            <br />
            Ваш отзыв поможет нам стать ещё лучше.
          </p>

          <button
            className="submit-button"
            onClick={() => {
              setRating(0);
              setReview("");
              setName("");
              setSent(false);
            }}
          >
            Оставить ещё один отзыв
          </button>
        </div>
      </main>
    );
  }

  const displayRating = hoveredStar || rating;

  return (
    <main className="page">
      <div className="card">
        <img src={logo} className="logo" alt="Solemar" />

        <div className="divider"></div>

        <h1>Как вам отдых в Solemar?</h1>

        <p className="subtitle">
          Ваше мнение очень важно для нас
        </p>

        <form onSubmit={handleSubmit}>
          <label>Оцените ваш отдых</label>

          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={star <= displayRating ? "star active" : "star"}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                aria-label={`${star} из 5`}
              >
                ★
              </button>
            ))}
          </div>

          {displayRating > 0 && (
            <div className="rating-text" key={displayRating}>
              {RATING_LABELS[displayRating]}
            </div>
          )}

          <label>Ваш отзыв</label>

          <textarea
            placeholder="Расскажите о вашем отдыхе..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          <label>Ваше имя</label>

          <input
            type="text"
            placeholder="Необязательно"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Отправляем..." : "Отправить отзыв"}
          </button>
        </form>

        <p className="privacy">
          Отзыв используется для улучшения качества обслуживания
        </p>
      </div>
    </main>
  );
}

function Admin() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const stats = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.length;
    const avg = (
      reviews.reduce((sum, r) => sum + r.rating, 0) / total
    ).toFixed(1);
    const fiveStars = reviews.filter((r) => r.rating === 5).length;
    return { total, avg, fiveStars };
  }, [reviews]);

  useEffect(() => {
    let cancelled = false;

    async function fetchReviews() {
      setLoading(true);

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error(error);
        alert("Не удалось загрузить отзывы");
      } else {
        setReviews(data || []);
      }

      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthChecked(true);

      if (currentUser) {
        fetchReviews();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthChecked(true);

      if (currentUser) {
        fetchReviews();
      } else {
        setReviews([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function login(e) {
    e.preventDefault();
    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Неверная почта или пароль");
      console.error(error);
    }

    setAuthLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setReviews([]);
  }

  /* Auth check loading */
  if (!authChecked) {
    return (
      <main className="page">
        <div className="card" style={{ textAlign: 'center' }}>
          <img src={logo} className="logo" alt="Solemar" />
          <div className="divider"></div>
          <p className="subtitle">Загрузка...</p>
        </div>
      </main>
    );
  }

  /* Login form */
  if (!user) {
    return (
      <main className="page">
        <div className="card">
          <img src={logo} className="logo" alt="Solemar" />

          <div className="divider"></div>

          <h1>Админ-панель</h1>

          <p className="subtitle">
            Войдите, чтобы посмотреть отзывы
          </p>

          <form onSubmit={login}>
            <label>Почта</label>

            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Пароль</label>

            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="submit-button"
              type="submit"
              disabled={authLoading}
            >
              {authLoading ? "Входим..." : "Войти"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  /* Dashboard */
  return (
    <main className="page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <img
              src={logo}
              className="admin-logo"
              alt="Solemar"
            />
            <h1>Отзывы Solemar</h1>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Выйти
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value blue">{stats.total}</div>
              <div className="stat-label">Всего отзывов</div>
            </div>
            <div className="stat-card">
              <div className="stat-value gold">★ {stats.avg}</div>
              <div className="stat-label">Средняя оценка</div>
            </div>
            <div className="stat-card">
              <div className="stat-value orange">{stats.fiveStars}</div>
              <div className="stat-label">Оценок «5»</div>
            </div>
          </div>
        )}

        {/* Reviews */}
        {loading ? (
          <div className="loading-spinner">
            Загрузка отзывов...
          </div>
        ) : reviews.length === 0 ? (
          <div className="admin-empty">
            <p>Пока отзывов нет.</p>
          </div>
        ) : (
          <div className="admin-reviews-grid">
            {reviews.map((item) => (
              <div
                className="admin-card"
                key={item.id}
              >
                <div className="admin-rating">
                  {"★".repeat(item.rating)}
                  {"☆".repeat(5 - item.rating)}
                </div>

                <h3>{item.name || "Гость"}</h3>

                <p className="admin-review">
                  {item.review}
                </p>

                <small>
                  {new Date(item.created_at).toLocaleString(
                    "ru-RU"
                  )}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function App() {
  const path = window.location.pathname;

  if (path === "/admin") {
    return <Admin />;
  }

  return <ReviewForm />;
}

export default App;