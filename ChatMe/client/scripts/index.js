if (checkLocalstorageForLogin()) {
    window.location.href = "../chat.html";
}
if (checkLocalstorageForConfirm()) {
    var prompt = document.getElementById("prompt");

    // Mostra la sezione di sfondo bianco con la scritta e i due bottoni
    prompt.style.display = "block";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "block";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "block";

    document.getElementById("prompt-error").innerText =
        "You have saved data";
    document.getElementById("prompt-text").innerText =
        "Do you want to go to the confirmation page?";

    // Aggiungi un event listener al bottone "Yes"
    document.getElementById("yes-button").addEventListener("click", () => {
        window.location.href = "../confirm.html";
    });

}

/*Toggle prompt*/
document.getElementById("no-button").addEventListener("click", () => {
    var prompt = document.getElementById("prompt");
    prompt.style.display = "none";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "none";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "none";
});

document.getElementById("yes-button").addEventListener("click", () => {
    var prompt = document.getElementById("prompt");
    prompt.style.display = "none";

    var yesButton = document.getElementById("yes-button");
    yesButton.style.display = "none";

    var noButton = document.getElementById("no-button");
    noButton.style.display = "none";
});