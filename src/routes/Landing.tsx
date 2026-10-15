import StudioIcon from '../components/StudioIcon'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, MousePointer2, Plus, Type, Image, Square, Undo2, Monitor } from 'lucide-react'

const tools = [MousePointer2, Plus, Type, Image, Square]

export default function Landing() {
  return (
    <div className="studio-home">
      <section className="studio-intro">
        <div className="studio-eyebrow"><span /> A space for your next idea</div>
        <div className="studio-heading-row">
          <h1>Your corner<br />of the <em>internet.</em></h1>
          <div className="studio-intro-copy">
            <p>A portfolio. A small business. Something entirely your own. Bring it to life on a canvas that works the way you think.</p>
            <Link to="/canvas" className="studio-button">Make something yours <ArrowUpRight size={18} /></Link>
            <span className="studio-note">Start with a blank page. See where it goes.</span>
          </div>
        </div>
      </section>

      <section className="studio-workspace" aria-label="A preview of the Aria design workspace">
        <div className="studio-workspace-bar"><span className="studio-project"><span className="studio-project-dot" /> Untitled idea <span className="studio-saved">/ Saved on this device</span></span><span className="studio-preview-label"><Monitor size={14} /> Desktop <span>100%</span></span><Link to="/canvas">Open canvas <ArrowUpRight size={14} /></Link></div>
        <div className="studio-workspace-body">
          <div className="studio-tools" aria-hidden="true">{tools.map((Icon, i) => <span className={i === 0 ? 'selected' : ''} key={i}><Icon size={18} /></span>)}<span className="studio-tool-bottom"><Undo2 size={17} /></span></div>
          <div className="studio-artboard">
            <div className="studio-demo-nav"><strong>form & field</strong><span>Objects &nbsp; About &nbsp; Contact</span></div>
            <div className="studio-demo-content"><div className="studio-demo-type"><span className="studio-small-label">Independent design studio · Est. 2026</span><h2>Good things.<br /><i>Made slowly.</i></h2><p>Objects and spaces for a more considered everyday.</p><span className="studio-demo-link">Explore our work <ArrowUpRight size={13} /></span></div><div className="studio-still-life" aria-hidden="true"><div className="studio-disc" /><div className="studio-vase"><span /></div><div className="studio-plinth" /><div className="studio-caption">01 — A study in balance</div></div></div>
            <span className="studio-selection-label" aria-hidden="true">Heading</span><div className="studio-selection" aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
          <div className="studio-properties" aria-hidden="true"><span className="studio-small-label">Design</span><h3>Heading</h3><div className="studio-property-row"><span>Position</span><span>Absolute</span></div><div className="studio-property-boxes"><span>X &nbsp; 48</span><span>Y &nbsp; 120</span></div><hr /><span className="studio-small-label">Typography</span><div className="studio-property-field">Georgia <span><StudioIcon name="chevron" size={12} /></span></div><div className="studio-property-boxes"><span>Regular</span><span>64 px</span></div><div className="studio-property-row"><span>Colour</span><span><b /> #292D25</span></div><hr /><div className="studio-property-row"><span>Opacity</span><span>100%</span></div><div className="studio-property-slider" /></div>
        </div>
        <div className="studio-workspace-footer"><span><span className="studio-status-dot" /> Room to experiment. Freedom to make it yours.</span><span>Built with Aria <StudioIcon size={10} /></span></div>
      </section>

      <section className="studio-paths">
        <div className="studio-section-heading"><span className="studio-eyebrow">Find your starting point</span><h2>No two ideas<br />start the same way.</h2></div>
        <Link to="/canvas" className="studio-path"><span className="studio-path-number">01 / THE CANVAS</span><h3>Follow your own lead.</h3><p>Place text, images and shapes exactly where you want them. Connect pages. Add a little motion.</p><span className="studio-path-link">Start from scratch <ArrowUpRight size={18} /></span></Link>
        <Link to="/templates" className="studio-path"><span className="studio-path-number">02 / THE COLLECTION</span><h3>A little head start.</h3><p>Find a template with the right feeling, then change the type, colours and details until it feels like you.</p><span className="studio-path-link">Explore templates <ArrowUpRight size={18} /></span></Link>
      </section>
      <section className="studio-market"><span className="studio-eyebrow">Made to be shared</span><h2>Someone else’s starting point<br />could be your next idea.</h2><Link to="/marketplace">Visit the marketplace <ArrowRight size={18} /></Link></section>
      <footer className="studio-footer"><Link to="/" className="studio-wordmark">aria<span><StudioIcon size={12} /></span></Link><p>A little more freedom for the web.</p><span>Make it your own.</span></footer>
    </div>
  )
}
