'use strict';
angular.module('app')
        .controller('contentCtrl', contentCtrl);
angular.module('app')
        .directive('fileModel', ['$parse', function ($parse) {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        var model = $parse(attrs.fileModel);
                        var modelSetter = model.assign;

                        element.bind('change', function () {
                            scope.$apply(function () {
                                modelSetter(scope, element[0].files[0]);
                            });
                        });
                    }
                };
            }]);
contentCtrl.$inject = ['$scope', '$state', '$timeout', '$http', 'creds', 'ngToast', 'configService'];
function contentCtrl($scope, $state, $timeout, $http, creds, ngToast, configService) {
    $scope.creds = {};
    $scope.creds.access_key = creds.apiKey;
    $scope.creds.secret_key = creds.apiSecret;
    $scope.creds.bucketImg = 'iflowimgin';
    $scope.creds.bucketVid = 'iflowvidin';


    $scope.uploadFileTrue = false;
    $scope.msg = "Completado";


    function getVideos() {
        $http.get('https://1y0rxj9ll6.execute-api.us-west-2.amazonaws.com/prod/dbvideos?TableName=video', configService.getConfig()).then(function (res) {
            $scope.contentVideos = [];
            for (var item in  res.data.Items) {
                if (res.data.Items[item].user['S'] == window.sessionStorage.getItem('user').toString())
                    $scope.contentVideos.push(res.data.Items[item]);
            }
//            console.log(JSON.stringify($scope.contentVideos));
        });
    }
    ;
    function getImages() {
        $http.get('https://r4mhv473uk.execute-api.us-west-2.amazonaws.com/prod/dbimages?TableName=image', configService.getConfig()).then(function (res) {
            $scope.contentImages = [];
            for (var item in  res.data.Items) {
                if (res.data.Items[item].user['S'] == window.sessionStorage.getItem('user').toString())
                    $scope.contentImages.push(res.data.Items[item]);
            }
//            console.log(JSON.stringify($scope.contentImages));
        });
    }
    ;


    function getPromotions() {
        //Se listan las promociones disponibles de un hotel.

        //TEMPORAL Mientras alejo conecta las promociones para un hotel especifico
        $http.get('https://fj40cj5l8f.execute-api.us-west-2.amazonaws.com/prod/promotios?TableName=promotion').then(function (res) {
            $scope.contentPromotions = res.data.Items;
        });
        //ALEJO, por favor agregar en tabla promotions, el campo user, para garantizar que la promo pertence a un hotel especidico
        /* 
         $http.get('https://fj40cj5l8f.execute-api.us-west-2.amazonaws.com/prod/promotios?TableName=promotion', configService.getConfig()).then(function (res){
         $scope.contentPromotions = [];
         for (var item in  res.data.Items) {
         if (res.data.Items[item].user['S'] == window.sessionStorage.getItem('user').toString() )
         $scope.contentPromotions.push(res.data.Items[item]);
         }
         
         
         });*/
    }
    ;


    getImages();
    getVideos();
    getPromotions();

    AWS.config.update({accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key});
    AWS.config.region = 'us-west-2';
    $scope.bucketImg = new AWS.S3({params: {Bucket: $scope.creds.bucketImg}});
    $scope.bucketVid = new AWS.S3({params: {Bucket: $scope.creds.bucketVid}});

    $scope.uploadFile = function () {
        $scope.uploadFileTrue = true;
        var file = $scope.myFile;
        console.log('file is ' + file.type);
        console.dir(file);

        var params = {
            Key: file.name,
            ACL: 'public-read',
            ContentType: file.type,
            Body: file,
            Metadata: {user: window.sessionStorage.getItem('user')},
            ServerSideEncryption: 'AES256'
        };

        $scope.bucketImg.putObject(params, function (error, data) {

            if (error) {
                console.log(error.message);
                return false;
            } else {
                // Upload Successfully Finished
            }
        }).on('httpUploadProgress', function (progress) {
            $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
            if ($scope.uploadProgress == 100) {
                $scope.msg = "Procesando....";
                $timeout(function () {
                    $scope.uploadProgress = 0;
                    $scope.uploadFileTrue = false;
                    getImages();
                }, 5000);

            }
            $scope.$digest();
        });
    };

    $scope.uploadVideo = function () {
        $scope.uploadFileTrue = true;

        var file = $scope.myFile;
        console.log('file is ' + file.type);
        console.dir(file);

        var params = {
            Key: file.name,
            ACL: 'public-read',
            ContentType: file.type,
            Body: file,
            Metadata: {user: window.sessionStorage.getItem('user')},
            ServerSideEncryption: 'AES256'
        };

        $scope.bucketVid.putObject(params, function (error, data) {

            if (error) {
                console.log(error.message);
                return false;
            } else {
                // Upload Successfully Finished
                console.log('File Uploaded Successfully');

            }
        }).on('httpUploadProgress', function (progress) {
            $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
            if ($scope.uploadProgress == 100) {
                $scope.msg = "Procesando....";
                $timeout(function () {
                    $scope.uploadProgress = 0;
                    $scope.uploadFileTrue = false;
                    getVideos();
                }, 5000);
            }
            $scope.$digest();
        });
    };

    $scope.deleteImage = function (name) {


        $scope.bucketImg.deleteObject({Bucket: 'iflowimgin', Key: name}, function (err, data) {
            if (err)
                console.log(err, err.stack); // an error occurred
            else {
                console.log("file successfully deleted");
                getImages();
                $state.go('app.images', {}, {reload: true});
            }
        });
    };
    $scope.deleteVideo = function (name) {

        $scope.bucketVid.deleteObject({Bucket: 'iflowvidin', Key: name}, function (err, data) {
            if (err)
                console.log(err, err.stack); // an error occurred
            else {
                console.log("file successfully deleted");
                $timeout(function () {
                    getVideos();
                    $state.go('app.videos', {}, {reload: true});
                }, 3000);
            }
            // successful response
        });
    };

    //CRUD PROMOTIONS
    $scope.promotion = "";
    $scope.formPromotion = {
        title: "",
        link_qr: "",
        image: "",
        active: "1",
        user: window.sessionStorage.getItem('user').toString()
    };

    $scope.list4 = [];
    $scope.hideMe = function () {
        return $scope.list4.length > 0;
    };

    $scope.contentExist = function () {
        $scope.promotion = "";
        var total = $scope.list4.length;
        var last = total - 1;

        if (total > 0) {

            $scope.formPromotion.image = $scope.list4[last].path["S"]; //Asigno la url de la imagen seleccionada.

            //Solo se debe permitir una imagen
            for (var con in $scope.list4) {
                if (con < last) {
                    $scope.list4.splice(con, 1);
                    break;
                }
            }
        }
    };

    $scope.savePromotion = function (formData) {
         
        //
        //
        //ALEJO por favor me colaboras generando el servicio que crea en DynamoDB la nueva promo en la tabla promotions 
        // A partir de los datos que llegan en el JSON formData={title:"",link_qr:"",image:"",active:"",user:""}; 
        //  
        //alert('Informacion que se envia' + JSON.stringify(formData)); 
        $scope.promotion = "Creada";
        $scope.list4 = [];
        $scope.formPromotion.title = "";
        $scope.formPromotion.link_qr = "";
        $scope.formPromotion.image = "";
    };
    
    $scope.deletePromotion = function (idPromotion) {
        var user = window.sessionStorage.getItem('user').toString();
        
        alert(idPromotion, user);
        //ALEJO por favor me colaboras generando el servicio que elimine en DynamoDB una promo asociada a un hotel (user)
        // A partir del id y user.
        
        $scope.promotion = "Eliminada";
    };
    
    $scope.updatePromotion = function (idPromo, formData) {

        //
        //
        //ALEJO por favor me colaboras generando el servicio que actualice en DynamoDB la inforacion promo en la tabla promotions 
        // A partir de los datos que llegan en el JSON formData={title:"",link_qr:"",image:"",active:"",user:""} y el idPromo: id del promo a actualizar; 
        //  
        $scope.promotion = "Actualizada";
        $scope.list4 = [];
        $scope.formPromotion.title = "";
        $scope.formPromotion.link_qr = "";
        $scope.formPromotion.image = "";
    };

    //FIN CRUD PROMOTIONS

}
;



