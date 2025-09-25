const display = document.getElementById("display");

function appendValue(value) {
  display.value += value;
}

function clearDisplay() {
  display.value = "";
}

function calculate() {
  try {
    display.value = eval(display.value);
  } catch {
    display.value = "Error";
  }
}

function deleteLast() {
  display.value = display.value.slice(0, -1);
}

function logout() {
  // redirect back to login page
  window.location.href = "login.html"; // change to your actual login page
}
