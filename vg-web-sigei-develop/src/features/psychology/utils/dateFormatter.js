export function formatDateToSpanish(date) {
     if (!date) return "";
     let dateObj;
     if (typeof date === "string") {
          // Truncate microseconds to milliseconds (browsers may not support 6-digit precision)
          const normalized = date.replace(/(\.\d{3})\d+/, "$1");
          dateObj = normalized.includes("T") ? new Date(normalized) : new Date(normalized + "T00:00:00");
     } else {
          dateObj = new Date(date);
     }
     if (isNaN(dateObj.getTime())) return "";
     const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
     const day = String(dateObj.getDate()).padStart(2, "0");
     const month = months[dateObj.getMonth()];
     const year = dateObj.getFullYear();
     return `${day} de ${month} del ${year}`;
}

export function formatDateShort(date) {
     if (!date) return "";
     const dateObj = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
     if (isNaN(dateObj.getTime())) return "";
     const day = String(dateObj.getDate()).padStart(2, "0");
     const month = String(dateObj.getMonth() + 1).padStart(2, "0");
     const year = dateObj.getFullYear();
     return `${day}/${month}/${year}`;
}
