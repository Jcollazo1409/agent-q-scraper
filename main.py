import sys
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return "Agent Q 3 is running."

@app.route("/get-part-number", methods=["POST"])
def get_part_number():
    data = request.get_json()
    vin = data.get("vin", "")
    marca = data.get("marca", "").lower()
    pieza = data.get("pieza", "").lower()

    if marca != "bmw":
        return jsonify({"status": "error", "message": "Only BMW is supported at the moment."})

    # Simulated fuzzy matching and scraping result (placeholder logic)
    if "blower" in pieza and "regulator" in pieza:
        return jsonify({
            "status": "success",
            "part_number": "64119227670",
            "match_confidence": 0.92
        })
    else:
        return jsonify({
            "status": "not_found",
            "message": "No matching part number found."
        })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
