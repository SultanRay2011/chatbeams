document.addEventListener("DOMContentLoaded", function() {
    const users = JSON.parse(localStorage.getItem("users")) || {};
    const currentUser = localStorage.getItem("currentUser");

    // Helper function to show error messages
    function showError(element, message) {
        element.textContent = message;
        element.style.display = "block";
    }

    // Helper function to show success messages
    function showSuccess(element, message) {
        element.textContent = message;
        element.style.display = "block";
        setTimeout(() => {
            element.style.display = "none";
        }, 3000);
    }

    // ---------- LOGIN FUNCTIONALITY ----------
    if (document.getElementById("loginForm")) {
        document.getElementById("loginForm").addEventListener("submit", function(e) {
            e.preventDefault();
            const username = document.getElementById("loginUsername").value;
            const password = document.getElementById("loginPassword").value;
            if (users[username] && users[username].password === password) {
                localStorage.setItem("currentUser", username);
                window.location.href = "dashboard.html";
            } else {
                showError(document.getElementById("loginError"), "Invalid credentials. Please try again.");
            }
        });
    }

    // ---------- SIGNUP FUNCTIONALITY ----------
if (document.getElementById("signupForm")) {
    document.getElementById("signupForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const username = document.getElementById("signupUsername").value.trim();
        const displayName = document.getElementById("signupDisplayName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const rePassword = document.getElementById("signupRePassword").value;
        const usernameError = document.getElementById("usernameError");
        const passwordError = document.getElementById("passwordError");

        // Clear previous error messages
        usernameError.style.display = "none";
        passwordError.style.display = "none";

        // Validation checks
        if (username === "" || displayName === "" || email === "" || password === "" || rePassword === "") {
            showError(usernameError, "All fields are required.");
            return;
        }
        if (username.length < 6) {
            showError(usernameError, "Username must be at least 6 characters long.");
            return;
        }
        if (password.length < 6) {
            showError(passwordError, "Password must be at least 6 characters long.");
            return;
        }
        if (username === displayName) {
            showError(usernameError, "Username cannot be the same as display name.");
            return;
        }
        if (password !== rePassword) {
            showError(passwordError, "Passwords do not match.");
            return;
        }

        if (users[username]) {
            showError(usernameError, "Username already exists.");
        } else {
            users[username] = { displayName, email, password };
            localStorage.setItem("users", JSON.stringify(users));
            showSuccess(document.getElementById("signupSuccess"), "Signup successful! Please log in.");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        }
    });
}

    // ---------- DASHBOARD FUNCTIONALITY ----------
    if (document.querySelector(".dashboard-container")) {
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        const displayName = users[currentUser].displayName || currentUser;
        document.getElementById("welcomeMessage").textContent = "Welcome, " + displayName;

        const friends = JSON.parse(localStorage.getItem("friends_" + currentUser)) || [];
        const pendingRequests = JSON.parse(localStorage.getItem("pending_" + currentUser)) || [];
        const friendListEl = document.getElementById("friendList");
        const pendingListEl = document.getElementById("pendingList");
        const noFriendsMessageEl = document.getElementById("noFriendsMessage");
        const noPendingMessageEl = document.getElementById("noPendingMessage");

        function renderList(listEl, items, noItemsMessageEl, itemRenderer) {
            listEl.innerHTML = "";
            if (items.length === 0) {
                noItemsMessageEl.style.display = "block";
            } else {
                noItemsMessageEl.style.display = "none";
                items.forEach(itemRenderer);
            }
        }

        function renderFriends() {
            renderList(friendListEl, friends, noFriendsMessageEl, function(friend) {
                const li = document.createElement("li");
                li.textContent = friend;
                const removeBtn = document.createElement("button");
                removeBtn.textContent = "Remove";
                removeBtn.style.marginLeft = "10px";
                removeBtn.addEventListener("click", function(e) {
                    e.stopPropagation();
                    unfriend(friend);
                });
                li.appendChild(removeBtn);
                li.addEventListener("click", function() {
                    selectFriend(friend);
                });
                friendListEl.appendChild(li);
            });
        }

        function renderPendingRequests() {
            renderList(pendingListEl, pendingRequests, noPendingMessageEl, function(requester) {
                const li = document.createElement("li");
                li.textContent = requester;
                const acceptBtn = document.createElement("button");
                acceptBtn.textContent = "Accept";
                acceptBtn.style.marginLeft = "10px";
                acceptBtn.addEventListener("click", function(e) {
                    e.stopPropagation();
                    acceptFriendRequest(requester);
                });
                const declineBtn = document.createElement("button");
                declineBtn.textContent = "Decline";
                declineBtn.style.marginLeft = "5px";
                declineBtn.addEventListener("click", function(e) {
                    e.stopPropagation();
                    declineFriendRequest(requester);
                });
                li.appendChild(acceptBtn);
                li.appendChild(declineBtn);
                pendingListEl.appendChild(li);
            });
        }

        renderFriends();
        renderPendingRequests();

        document.getElementById("addFriendForm").addEventListener("submit", function(e) {
            e.preventDefault();
            const friendName = document.getElementById("friendName").value.trim();
            const friendError = document.getElementById("friendError");
            friendError.style.display = "none";

            if (!friendName) return;

            if (!users[friendName]) {
                showError(friendError, "Username does not exist.");
                return;
            }
            if (friends.includes(friendName)) {
                showError(friendError, "You are already friends with " + friendName);
                return;
            }
            let targetPending = JSON.parse(localStorage.getItem("pending_" + friendName)) || [];
            if (targetPending.includes(currentUser)) {
                showError(friendError, "Friend request already sent.");
                return;
            }
            targetPending.push(currentUser);
            localStorage.setItem("pending_" + friendName, JSON.stringify(targetPending));
            showSuccess(document.getElementById("friendSuccess"), "Friend request sent to " + friendName);
            document.getElementById("friendName").value = "";
        });

        let currentChatFriend = null;
        const chatHeader = document.getElementById("chatHeader");
        const chatMessagesEl = document.getElementById("chatMessages");

        function selectFriend(friend) {
            currentChatFriend = friend;
            chatHeader.textContent = "Chat with " + friend;
            loadChat();
        }

        function loadChat() {
            const chatKey = "chat_" + currentUser + "_" + currentChatFriend;
            const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
            chatMessagesEl.innerHTML = "";
            messages.forEach(function(msg) {
                const msgDiv = document.createElement("div");
                msgDiv.textContent = `${msg.sender}: ${msg.text} (${msg.time})`;
                chatMessagesEl.appendChild(msgDiv);
            });
        }

        document.getElementById("messageForm").addEventListener("submit", function(e) {
            e.preventDefault();
            if (!currentChatFriend) {
                showError(document.getElementById("chatError"), "Please select a friend to chat with.");
                return;
            }
            const messageInput = document.getElementById("messageInput");
            const message = messageInput.value.trim();
            if (!message) return;
            const chatKey = "chat_" + currentUser + "_" + currentChatFriend;
            const reverseChatKey = "chat_" + currentChatFriend + "_" + currentUser;
            const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
            const reverseMessages = JSON.parse(localStorage.getItem(reverseChatKey)) || [];
            const timestamp = new Date().toLocaleTimeString();
            const messageObj = { sender: displayName, text: message, time: timestamp };
            messages.push(messageObj);
            reverseMessages.push(messageObj);
            localStorage.setItem(chatKey, JSON.stringify(messages));
            localStorage.setItem(reverseChatKey, JSON.stringify(reverseMessages));
            loadChat();
            messageInput.value = "";
        });

        document.getElementById("logoutBtn").addEventListener("click", function(e) {
            e.preventDefault();
            localStorage.removeItem("currentUser");
            window.location.href = "login.html";
        });

        function acceptFriendRequest(requester) {
            pendingRequests.splice(pendingRequests.indexOf(requester), 1);
            localStorage.setItem("pending_" + currentUser, JSON.stringify(pendingRequests));
            friends.push(requester);
            localStorage.setItem("friends_" + currentUser, JSON.stringify(friends));
            let requesterFriends = JSON.parse(localStorage.getItem("friends_" + requester)) || [];
            if (!requesterFriends.includes(currentUser)) {
                requesterFriends.push(currentUser);
                localStorage.setItem("friends_" + requester, JSON.stringify(requesterFriends));
            }
            renderFriends();
            renderPendingRequests();
            showSuccess(document.getElementById("friendSuccess"), "You are now friends with " + requester);
        }

        function declineFriendRequest(requester) {
            pendingRequests.splice(pendingRequests.indexOf(requester), 1);
            localStorage.setItem("pending_" + currentUser, JSON.stringify(pendingRequests));
            renderPendingRequests();
            showSuccess(document.getElementById("friendSuccess"), "Friend request from " + requester + " declined.");
        }

        function unfriend(friend) {
            friends.splice(friends.indexOf(friend), 1);
            localStorage.setItem("friends_" + currentUser, JSON.stringify(friends));
            let friendFriends = JSON.parse(localStorage.getItem("friends_" + friend)) || [];
            friendFriends.splice(friendFriends.indexOf(currentUser), 1);
            localStorage.setItem("friends_" + friend, JSON.stringify(friendFriends));
            renderFriends();
            showSuccess(document.getElementById("friendSuccess"), "You are no longer friends with " + friend);
        }
    }

    // ---------- SETTINGS PAGE FUNCTIONALITY ----------
    if (document.getElementById("settingsForm")) {
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }
        const userData = users[currentUser];
        const displayName = userData.displayName || currentUser;
        document.getElementById("welcomeMessage").textContent = "Welcome, " + displayName;
        document.getElementById("currentUsername").value = currentUser;
        document.getElementById("newDisplayName").placeholder = userData.displayName || "";
        document.getElementById("newEmail").placeholder = userData.email || "";

        document.getElementById("settingsForm").addEventListener("submit", function(e) {
            e.preventDefault();
            const newUsername = document.getElementById("newUsername").value.trim();
            const newName = document.getElementById("newDisplayName").value.trim();
            const newEmail = document.getElementById("newEmail").value.trim();
            const newPassword = document.getElementById("newPassword").value;
            const confirmNewPassword = document.getElementById("confirmNewPassword").value;

            if (newPassword !== confirmNewPassword) {
                showError(document.getElementById("passwordError"), "New passwords do not match.");
                return;
            }

            let updatedUsername = currentUser;
            if (newUsername && newUsername !== currentUser) {
                if (users[newUsername]) {
                    showError(document.getElementById("usernameError"), "Username is already taken.");
                    return;
                }
                updatedUsername = newUsername;
            }

            if (updatedUsername !== currentUser) {
                users[updatedUsername] = Object.assign({}, userData);
                delete users[currentUser];
                localStorage.setItem("currentUser", updatedUsername);
            }

            if (newDisplayName) users[updatedUsername].displayName = newDisplayName;
            if (newEmail) users[updatedUsername].email = newEmail;
            if (newPassword) users[updatedUsername].password = newPassword;

            localStorage.setItem("users", JSON.stringify(users));
            showSuccess(document.getElementById("settingsSuccess"), "Settings updated successfully.");
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        });

        document.getElementById("deleteAccountBtn").addEventListener("click", function() {
            if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                delete users[currentUser];
                localStorage.setItem("users", JSON.stringify(users));
                localStorage.removeItem("friends_" + currentUser);
                localStorage.removeItem("pending_" + currentUser);
                localStorage.removeItem("currentUser");
                showSuccess(document.getElementById("settingsSuccess"), "Account deleted successfully.");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 2000);
            }
        });

        document.getElementById("logoutBtn").addEventListener("click", function(e) {
            e.preventDefault();
            localStorage.removeItem("currentUser");
            window.location.href = "login.html";
        });
    }

    // ---------- SWITCH ACCOUNTS FUNCTIONALITY ----------
    if (document.getElementById("switchAccountForm")) {
        const accountSelect = document.getElementById("accountSelect");
        for (const username in users) {
            const option = document.createElement("option");
            option.value = username;
            option.textContent = username;
            accountSelect.appendChild(option);
        }

        document.getElementById("switchAccountForm").addEventListener("submit", function(e) {
            e.preventDefault();
            const selectedUsername = accountSelect.value;
            localStorage.setItem("currentUser", selectedUsername);
            window.location.href = "dashboard.html";
        });

        // Add event listener for the remove button
        document.getElementById("removeAccountButton").addEventListener("click", function() {
            const selectedUsername = accountSelect.value;
            if (selectedUsername) {
                delete users[selectedUsername];
                localStorage.setItem("users", JSON.stringify(users));
                populateSwitchAccountDropdown();
                showSuccess(document.getElementById("accountSuccess"), "Account removed successfully.");
            }
        });

        // Populate the switch account dropdown
        function populateSwitchAccountDropdown() {
            accountSelect.innerHTML = "";
            for (const username in users) {
                const option = document.createElement("option");
                option.value = username;
                option.textContent = username;
                accountSelect.appendChild(option);
            }
        }

        // Initial population of the switch account dropdown
        populateSwitchAccountDropdown();
    }

    // ---------- ADD NEW ACCOUNT FUNCTIONALITY ----------
    if (document.getElementById("addAccountForm")) {
        document.getElementById("addAccountForm").addEventListener("submit", function(e) {
            e.preventDefault();
            const newUsername = document.getElementById("newUsername").value.trim();
            const newPassword = document.getElementById("newPassword").value.trim();
            const usernameError = document.getElementById("usernameError");
            const passwordError = document.getElementById("passwordError");

            // Clear previous error messages
            usernameError.style.display = "none";
            passwordError.style.display = "none";

            // Validation checks
            if (newUsername === "" || newPassword === "") {
                showError(usernameError, "All fields are required.");
                return;
            }
            if (newUsername.length < 6) {
                showError(usernameError, "Username must be at least 6 characters long.");
                return;
            }
            if (newPassword.length < 6) {
                showError(passwordError, "Password must be at least 6 characters long.");
                return;
            }

            if (users[newUsername]) {
                showError(usernameError, "Username already exists.");
            } else {
                users[newUsername] = { displayName: newUsername, email: "", password: newPassword };
                localStorage.setItem("users", JSON.stringify(users));
                localStorage.setItem("currentUser", newUsername);
                window.location.href = "dashboard.html";
            }
        });
    }
});