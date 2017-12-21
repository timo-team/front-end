'use stric';

$(document).ready(function(){
  $("#password").password('toggle');

  $('#authentication-form').submit(function(e){
    e.preventDefault();
    e.stopPropagation();
    $.post('login.php',
      {
        login : $('#username').val(),
        password : $('#password').val()
      })
    .done(function(data){
      console.log(data);
      if(data == 'Ok'){
        window.location = "dashboard.html"
      } else {
        $('.alert.alert-danger').show();
        $('.alert.alert-danger p').text('Vos identifiants sont incorrects.');
      }
    })
    .fail(function(){
      $('.alert.alert-danger p').text('Un problème techniques est survenu. Veuillez réessayer.');
    });
  });
});
