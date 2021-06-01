const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Схема для пользователя
const userSchema = new Schema({
  name:{
    type: String,
    required: true,
  },
  second_name:{
    type: String,
  },
  login:{
    type: String,
    required: true,
  },
  password:{
    type: String,
    required: true,
  },
  meta:{
    type:String,
  },
  photo:{
    type:String,
  },
  // бичи пользователя
  bitches:[{
    type: Schema.Types.ObjectId,
    ref: "Bitch"
  }],
  // максимально допустимое количесво бич
  max_bitch:{
    type:Number,
    default: 5,
  },
  // текущее количесвтво бич
  current_bitch:{
    type:Number,
    default: 0,
  },
});

module.exports = mongoose.model("User", userSchema);
