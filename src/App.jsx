import { useEffect, useState } from "react";
import "./App.css";
import logo from "./assets/solemar logo.jpg";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function ReviewForm() {
  const [rating, setRating] = useState(0);
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
                className={star <= rating ? "star active" : "star"}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div className="rating-text">
              {rating === 1 && "Очень плохо"}
              {rating === 2 && "Плохо"}
              {rating === 3 && "Нормально"}
              {rating === 4 && "Хорошо"}
              {rating === 5 && "Отлично!"}
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

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  async function loadReviews() {
    setLoading(true);

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Не удалось загрузить отзывы");
    } else {
      setReviews(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

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
    } else {
      await checkUser();
    }

    setAuthLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setReviews([]);
  }

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

        {loading ? (
          <div className="admin-card">
            <p>Загрузка отзывов...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="admin-card">
            <p>Пока отзывов нет.</p>
          </div>
        ) : (
          reviews.map((item) => (
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
          ))
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