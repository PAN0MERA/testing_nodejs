$(document).ready(function(){
  $("#switch1").on("click", function(){
    if($("#switch1").hasClass("switcher-active")){
        $("#form1").slideToggle(300);
        $("#switch1").removeClass("switcher-active");
    }
    else{
      $("#form1").slideToggle(300);
      $("#switch1").addClass("switcher-active");
      if($("#switch2").hasClass("switcher-active")){
        $("#switch2").removeClass("switcher-active");
        $("#form2").slideToggle(300);
        }
    }
  });
  $("#switch2").on("click", function(){
    if($("#switch2").hasClass("switcher-active")){
        $("#form2").slideToggle(300);
        $("#switch2").removeClass("switcher-active");
    }
    else{
      $("#form2").slideToggle(300);
      $("#switch2").addClass("switcher-active");
      if($("#switch1").hasClass("switcher-active")){
        $("#switch1").removeClass("switcher-active");
        $("#form1").slideToggle(300);
        }
    }
  });

});
