var delete_this = document.querySelectorAll('.delete_this');
for(var i =0; i<delete_this.length; i++){
  delete_this[i].onclick = async function(){
    var bdid = this.parentElement.getAttribute('bdid');
    var bitch = {
      bdid: bdid,
    };

    var response =  await fetch('/create', {
      method: "DELETE",
      headers:{
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(bitch)
    });
    window.location.replace("/");
  };
}

var change_this = document.querySelectorAll(".change_this");
for(var i=0; i<change_this.length; i++){
  change_this[i].onclick = function(){
    var bdid = this.parentElement.getAttribute('bdid');

    window.location.replace(`/change_bitch?token=1&bdid=${bdid}`);
  }
}

let redactir_user = document.getElementById('change_user');
redactir_user.onclick = function(){
  window.location.replace(`/change_user`);
}
