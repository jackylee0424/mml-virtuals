import type React from "react"

const MiniMap: React.FC = () => {
  return (
    <div className="mini-map">
      <div className="map-field">
        <div className="dot green" style={{ top: "100%", left: "100%" }}></div>
        <div className="dot green" style={{ top: "40%", left: "60%" }}></div>
        <div className="dot red" style={{ top: "70%", left: "50%" }}></div>
        <div className="dot red" style={{ top: "80%", left: "20%" }}></div>
      </div>
    </div>
  )
}

export default MiniMap

