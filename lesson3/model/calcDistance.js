

exports.deg2rad = function(deg){
    return deg * Math.PI/180.00;
}

exports.rad2deg = function(rad){
    return rad*180.00/Math.PI;
}

module.exports = {
    calcDistance : async (lat1, lon1, lat2, lon2) => {
        var theta = lon1 - lon2;
        dist = Math.sin(this.deg2rad(lat1))*Math.sin(this.deg2rad(lat2)) + Math.cos(this.deg2rad(lat1))
        *Math.cos(this.deg2rad(lat2))*Math.cos(this.deg2rad(theta));
        dist = Math.acos(dist);
        dist = this.rad2deg(dist);
        dist = dist*60*1.1515; //mile
        dist = dist*1.609344;
        return dist*1000;
        //return Number(dist*1000).toFixed(2);
    }    
}
