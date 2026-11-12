"use strict";

const demoBooks = [
  { title: "Капитанская дочка", author: "Александр Пушкин", year: "1836" },
  { title: "Герой нашего времени", author: "Михаил Лермонтов", year: "1840" },
  { title: "Мёртвые души", author: "Николай Гоголь", year: "1842" },
  { title: "Отцы и дети", author: "Иван Тургенев", year: "1862" },
  { title: "Преступление и наказание", author: "Фёдор Достоевский", year: "1866" }
];

const button = document.getElementById("change-text-button");
const message = document.getElementById("interactive-message");
const booksBody = document.getElementById("books-body");
const bookCount = document.getElementById("book-count");
const loadStatus = document.getElementById("load-status");

button.addEventListener("click", () => {
  console.log("Кнопка нажата");
  message.textContent = "Готово! Текст изменён с помощью JavaScript ✨";
});

function renderBooks(books) {
  booksBody.replaceChildren();

  books.forEach((book, index) => {
    const row = document.createElement("tr");
    [String(index + 1).padStart(2, "0"), book.title, book.author, book.year]
      .forEach((value) => {
        const cell = document.createElement("td");
        // исправлено: textContent вместо innerHTML — данные из таблицы не становятся HTML-кодом.
        cell.textContent = value;
        row.append(cell);
      });
    booksBody.append(row);
  });

  bookCount.textContent = `${books.length} ${bookWord(books.length)}`;
}

function bookWord(n) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "записей";
  if (n % 10 === 1) return "запись";
  if ([2, 3, 4].includes(n % 10)) return "записи";
  return "записей";
}

// исправлено: CSV разбирается с учётом кавычек, запятых внутри значений и переносов строк.
function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  const input = csv.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === '"') {
      if (inQuotes && input[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && input[i + 1] === "\n") i += 1;
      row.push(value);
      if (row.some((item) => item.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += ch;
    }
  }
  if (inQuotes) throw new Error("Некорректный CSV: не закрыты кавычки.");
  row.push(value);
  if (row.some((item) => item.trim() !== "")) rows.push(row);
  return rows;
}

function csvToBooks(csv) {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error("В таблице нет записей.");

  const headers = rows[0].map((text) => text.trim().toLowerCase());
  const titleIndex = headers.indexOf("название");
  const authorIndex = headers.indexOf("автор");
  const yearIndex = headers.indexOf("год");
  if ([titleIndex, authorIndex, yearIndex].includes(-1)) {
    throw new Error("Нужны столбцы: Название, Автор, Год.");
  }

  const books = rows.slice(1)
    .filter((row) => row.some((item) => item.trim() !== ""))
    .map((row) => ({
      title: (row[titleIndex] || "").trim(),
      author: (row[authorIndex] || "").trim(),
      year: (row[yearIndex] || "").trim()
    }))
    .filter((book) => book.title && book.author && book.year);

  if (!books.length) throw new Error("Не найдены заполненные строки.");
  return books;
}

async function loadBooks() {
  // Пока ссылка не добавлена, показываем демонстрационные данные, а не выдаём их за Google Таблицу.
  renderBooks(demoBooks);
  const url = (window.GOOGLE_SHEET_CSV_URL || "").trim();
  if (!url) {
    loadStatus.textContent = "Показаны демо-данные. Чтобы подключить Google Таблицу, вставьте CSV-ссылку в config.js.";
    return;
  }

  loadStatus.textContent = "Загружаем данные из Google Таблицы…";
  loadStatus.classList.remove("error");
  try {
    // исправлено: ждём fetch(), проверяем HTTP-статус и перехватываем сетевые ошибки.
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Ошибка HTTP ${response.status}`);
    const csv = await response.text();
    const books = csvToBooks(csv);
    renderBooks(books);
    loadStatus.textContent = "Данные успешно загружены из опубликованной Google Таблицы.";
  } catch (error) {
    // исправлено: сохраняем демо-список и выводим понятную ошибку вместо пустого экрана.
    loadStatus.classList.add("error");
    loadStatus.textContent = `Не удалось загрузить Google Таблицу (${error.message}). Показаны демо-данные.`;
    console.error("Ошибка загрузки CSV:", error);
  }
}

loadBooks();
