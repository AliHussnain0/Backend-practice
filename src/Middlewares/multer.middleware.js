import multer from "multer";
        //first i used a methode from multer library that is diskstorage
const storage = multer.diskStorage({          
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({storage},)