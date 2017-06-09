$(function() {
  const FADE_TIME = 150; // ms
  const COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('#usernameInput'); // Input for username
  var $avatarInput = $('#avatarInput'); // Input for avatar
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $participants = $('.participants')
  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var connected = false;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  function addParticipantsMessage (data) {
    var message = '';
    console.log(data);
    if (data.users) {
      for(var i=0;i<data.users.length;i++){
        message += `
          <span class="user" style="color: ${getUsernameColor(data.users[i].username)}">
            <img src="${data.users[i].avatar}" style="width:20px;"/>
            ${ data.users[i].username }
          </span>
        `;
      }
    }
    $participants.html(message);
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

    }
  }
  // Sets the client's avater
  function setAvatar () {
    avatar = cleanInput($avatarInput.val().trim());
    socket.emit('set avatar', avatar);
  }
  // Sends a chat message
  function sendMessage (message) {
    // Prevent markup from being injected into the message
    let cleanMessage = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (cleanMessage && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        avatar: avatar,
        message: cleanMessage
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', cleanMessage);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').html(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    var $usernameDiv = $(`<div class="username">
    ${data.username}
    </div>`)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $(`<div class="messageBody" style="
    border: 1px solid #000;
    padding: 5px;
    border-radius: 5px;
    width: 501px;
    margin-top: 7px;">`)
      .text(data.message);

    var $avatarDiv = $(`<div class="avatar" style=" margin: 0 10px 0 0;">
    <img src="${data.avatar}" style="width:20px;"/>
    </div>`)

    var $messageBlock = $('<div></div>')
      $messageBlock.append($usernameDiv, $messageBodyDiv)

    var $messageDiv = $('<li class="message" style="display:flex;"/>')
      .append($avatarDiv, $messageBlock);
    addMessageElement($messageDiv, options);
  }


  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        let message = $inputMessage.val();
        sendMessage(message);
      }
    }
  });

  // Click events

  var $loginForm = $('form.form');
  $loginForm.on('submit', function(event) {
    event.preventDefault();
    setUsername();
    if($avatarInput.val().trim().length > 0) {
      setAvatar();
    }
       // Tell the server your username
      socket.emit('add user', username, avatar);
 });

 var $changeProfileForm = $('form#change-profile-form');
  $changeProfileForm.on('submit', function(event) {
    event.preventDefault();
    if($('#avatar-input').val().trim().length > 0) {
      avatar = $('#avatar-input').val().trim();
      socket.emit("change avatar", avatar);
    }
    if($('#username-input').val().trim().length > 0) {
      username = $('#username-input').val().trim();
      socket.emit("change username", username);
    }
 });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    console.log(data);
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
  });

  socket.on('change avatar', function(data){
    log(`${data.username} has changed thier avatar to <img width="20" src="${data.avatar}"/>`);
    addParticipantsMessage(data);
    console.log(data);
  });
  socket.on('change username', function(data){
    log(`${data.username} has changed thier username to ${data.username}`);
    addParticipantsMessage(data);
    console.log(data);
  });
  socket.on('disconnect', function () {
    log('you have been disconnected');
  });

  socket.on('reconnect', function () {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', function () {
    log('attempt to reconnect has failed');
  });

});
var username;
var avatar = 'default-avatar.png';

function showProfileForm(elementSelector){
  $('#' + elementSelector).show();
  $("#avatar-input").val(avatar);
  $("#username-input").val(username);
}

function closeProfileForm(elementSelector){
  $('#' + elementSelector).hide()
}
