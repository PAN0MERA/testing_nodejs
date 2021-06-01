var delete_this = document.querySelectorAll('.delete_this');
for(var i =0; i<delete_this.length; i++){
  delete_this[i].onclick = async function(){
    var bdid = this.parentElement.getAttribute('bdid');

    var bitch = {
      bdid: bdid,
    };

    var response =  fetch('/create', {
      method: "DELETE",
      headers:{
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(bitch)
    });
    window.location.replace("/");
  };
}
