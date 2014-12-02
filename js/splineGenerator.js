var precalculatedSplines = [];

var presetSpeed = 2.0;
var presetTotLife = 4.0;
var presetLinesPerFrame = 3.0;
var presetCurlingRandomness = 2.0;

function generateSplinesPoints(object) {
    var quantity = parseInt($('#control-lines').val());
    var curling = parseFloat($('#curling').val());
    var numberOfControlPoints = parseFloat($('#ray-count').val());
    presetLinesPerFrame = parseInt($('#lines-per-frame').val());
    presetSpeed = parseFloat($('#speed').val());
    presetTotLife = parseFloat($('#life').val());
    presetCurlingRandomness = parseFloat($('#curling-randomness').val());
    var lastPercentagePrinted = 0;


    function computationalStep(i) {
        for (var j = 0; j < quantity/100; j++) {
            var points = generatePoints(object, 0, 400, 200,
                Math.random() * 2 * 3.14,
                curling - presetCurlingRandomness * Math.random() * curling, numberOfControlPoints); //spin
            precalculatedSplines.push(points);
            i += 1;
        }

        if (i < quantity) {

            var perc = (precalculatedSplines.length / quantity) * 100;
            $("button").prop("disabled",true);
            $('button').text("computing: " + parseInt(perc) + "%  ");

            console.log('bau');

            window.setTimeout(function () {
                computationalStep(i);
            }, 1);
        } else {
            $('button').attr('onclick', 'startanimate()');
            $("button").prop("disabled",false);
            $("button").text('start');
        }

    };

    computationalStep(0);

};





function addRandomSpline() {
    var id = Math.floor(Math.random() * precalculatedSplines.length + 1);
    var points = precalculatedSplines[id];
    var geometry = generateNurbsGeometry(points);
    var u = generateNurbsObject(geometry);
    u.speed.value = Math.random() * presetSpeed;
    u.baseOpacity.value = Math.random() * 1.0;
    u.totLife.value = presetTotLife;
}

function generatePoints(object, startHeight, endHeight, radius, initialAngle, numberOfSpin,numberOfControlPoints){
    var scaleObject = 200;

    var points = [];
    //SPLINE PROPERTY
    var radius = 50;
    var height = 3;
    var yStart = 0;
    var yDelta = 1;

    /*for ( var i = 0, j = numberOfControlPoints; i < j; i ++ ) {

        points.push(
            new THREE.Vector4(
                Math.sin(2*(i/numberOfControlPoints)*numberOfSpin)*radius,
                i ,
                Math.cos(2*(i/numberOfControlPoints)*numberOfSpin)*radius,
                1 // weight of control point: higher means stronger attraction
            )
        );

    }*/

    for ( var i = 0, j = numberOfControlPoints; i <= j; i ++ ) {
        var startPoint;
        var angle = 2*((i*numberOfSpin)/numberOfControlPoints)*3.14 + initialAngle;
        var y = yStart + (yDelta)*(i/numberOfControlPoints)*height;
        //var y = height - (yDelta)*(i/numberOfControlPoints)*height;
        startPoint = new THREE.Vector3(

                Math.sin(angle)*radius,
                y,
                Math.cos(angle)*radius
        );



        var endPoint = new THREE.Vector3( 0, y, 0 );
        var direction = endPoint.clone().sub(startPoint).normalize();

        //var raycaster = new THREE.Raycaster(startPoint , direction, 10, 500 );
        var raycaster = new THREE.Raycaster(startPoint, direction, 10, 1000 );
        raycaster.precision = 0;
        var intersection = raycaster.intersectObject(object, true);

        if(intersection.length > 0){
            var p = intersection[0].point.multiplyScalar(scaleObject);
            points.push(new THREE.Vector4(p.x, p.y, p.z, 1));
            //console.log(intersection[0].point)
        } else {
            //console.log("skp");
        }

    }

    precalculatedPoints = points;

    return points;
}

function generateNurbsGeometry(points) {
    // NURBS curve

    var nurbsControlPoints = [];
    var nurbsKnots = [];
    var nurbsDegree = 3;

    var nurbsSegment = 1000;


    for ( var i = 0; i <= nurbsDegree; i ++ ) {

        nurbsKnots.push( 0 );

    }

    for ( var i = 0, j = points.length; i < j; i ++ ) {

        nurbsControlPoints.push(
            points[i]
        );

        var knot = ( i + 1 ) / ( j - nurbsDegree );
        nurbsKnots.push( THREE.Math.clamp( knot, 0, 1 ) );

    }

    var nurbsCurve = new THREE.NURBSCurve(nurbsDegree, nurbsKnots, nurbsControlPoints);

    var nurbsGeometry = new THREE.Geometry();
    nurbsGeometry.vertices = nurbsCurve.getPoints(nurbsSegment);

    for ( var i = 0; i <= nurbsSegment; i ++ ) {

        nurbsGeometry.colors.push( new THREE.Color(i/nurbsSegment,0,0));

    }

    return nurbsGeometry;

}


function generateNurbsObject(geometry) {
    var attributes = {

        displacement: {	type: 'v3', value: [] },
        customColor: {	type: 'c', value: [] }


    };

    var uniforms = {

        amplitude: { type: "f", value: 5.0 },
        opacity:   { type: "f", value: 0.3 },
        time:      { type: "f", value: 0 },
        startTime: { type: "f", value: 0.0 },
        totLife: { type: "f", value: 4.0 },
        speed:   { type: "f", value: 0.1 },
        baseOpacity:   { type: "f", value: 1.0 }

    };

    var shaderMaterial = new THREE.ShaderMaterial( {

        uniforms: 		uniforms,
        attributes:     attributes,
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        vertexColors:   THREE.VertexColors,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

        blending: 		THREE.AdditiveBlending,
        depthTest:		true,
        transparent:	true

    });

    shaderMaterial.linewidth = 2;



    var nurbsLine = new THREE.Line( geometry, shaderMaterial );
    nurbsLine.position.set( 0, -200, 0 );
    group.add( nurbsLine );

    linesUniforms.push({uniform:uniforms, line:nurbsLine});
    return uniforms;
}