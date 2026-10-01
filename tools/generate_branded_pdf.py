#!/usr/bin/env python3
"""Generate branded PDF from prank_call_impro.md for niebawem.fun"""

import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.flowables import Flowable
from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing, String, Rect, Line

# Colors
MAGENTA = HexColor('#D946EF')
DEEP_PURPLE = HexColor('#4A1A7A')
VOID = HexColor('#0A0A0A')
LIGHT_PURPLE = HexColor('#F3E8FF')
LIGHT_MAGENTA = HexColor('#FCE7F3')
CREAM = HexColor('#FDF4FF')
GRAY = HexColor('#666666')
LIGHT_GRAY = HexColor('#F5F5F5')

WIDTH, HEIGHT = A4
MARGIN = 2 * cm

# Register Helvetica Neue (supports Polish characters)
import os
pdfmetrics.registerFont(TTFont('HelvNeue', '/System/Library/Fonts/HelveticaNeue.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('HelvNeueBold', '/System/Library/Fonts/HelveticaNeue.ttc', subfontIndex=4))
pdfmetrics.registerFont(TTFont('HelvNeueLight', '/System/Library/Fonts/HelveticaNeue.ttc', subfontIndex=6))
pdfmetrics.registerFont(TTFont('HelvNeueMedium', '/System/Library/Fonts/HelveticaNeue.ttc', subfontIndex=10))
HEADING_FONT = 'HelvNeueBold'
HEADING_SEMI = 'HelvNeueMedium'
BODY_FONT = 'HelvNeue'
BODY_LIGHT = 'HelvNeueLight'
MONO_FONT = 'Courier'


# ─── Styles ───

title_style = ParagraphStyle(
    'NiebawemTitle',
    fontName=HEADING_FONT,
    fontSize=28,
    leading=34,
    textColor=VOID,
    spaceAfter=4*mm,
    alignment=TA_LEFT,
)

subtitle_style = ParagraphStyle(
    'NiebawemSubtitle',
    fontName=BODY_FONT,
    fontSize=12,
    leading=16,
    textColor=DEEP_PURPLE,
    spaceAfter=12*mm,
    alignment=TA_LEFT,
)

h2_style = ParagraphStyle(
    'NiebawemH2',
    fontName=HEADING_FONT,
    fontSize=18,
    leading=24,
    textColor=DEEP_PURPLE,
    spaceBefore=14*mm,
    spaceAfter=6*mm,
)

h3_style = ParagraphStyle(
    'NiebawemH3',
    fontName=HEADING_SEMI,
    fontSize=13,
    leading=18,
    textColor=VOID,
    spaceBefore=8*mm,
    spaceAfter=4*mm,
)

body_style = ParagraphStyle(
    'NiebawemBody',
    fontName=BODY_FONT,
    fontSize=9.5,
    leading=14.5,
    textColor=VOID,
    spaceAfter=3*mm,
)

bold_body_style = ParagraphStyle(
    'NiebawemBoldBody',
    fontName=HEADING_SEMI,
    fontSize=9.5,
    leading=14.5,
    textColor=VOID,
    spaceAfter=3*mm,
)

bullet_style = ParagraphStyle(
    'NiebawemBullet',
    fontName=BODY_FONT,
    fontSize=9.5,
    leading=14.5,
    textColor=VOID,
    leftIndent=12*mm,
    bulletIndent=5*mm,
    spaceAfter=2*mm,
)

numbered_style = ParagraphStyle(
    'NiebawemNumbered',
    fontName=BODY_FONT,
    fontSize=9.5,
    leading=14.5,
    textColor=VOID,
    leftIndent=12*mm,
    bulletIndent=5*mm,
    spaceAfter=2*mm,
)

quote_style = ParagraphStyle(
    'NiebawemQuote',
    fontName=BODY_FONT,
    fontSize=9.5,
    leading=14.5,
    textColor=DEEP_PURPLE,
    leftIndent=10*mm,
    borderPadding=(3*mm, 3*mm, 3*mm, 3*mm),
    spaceAfter=3*mm,
)

link_style = ParagraphStyle(
    'NiebawemLink',
    fontName=BODY_FONT,
    fontSize=8.5,
    leading=13,
    textColor=GRAY,
    leftIndent=12*mm,
    bulletIndent=5*mm,
    spaceAfter=2*mm,
)

table_header_style = ParagraphStyle(
    'TableHeader',
    fontName=HEADING_SEMI,
    fontSize=9,
    leading=13,
    textColor=white,
)

table_cell_style = ParagraphStyle(
    'TableCell',
    fontName=BODY_FONT,
    fontSize=9,
    leading=13,
    textColor=VOID,
)


class AccentBar(Flowable):
    """Magenta accent bar"""
    def __init__(self, width, height=2):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        self.canv.setFillColor(MAGENTA)
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)


class SectionDivider(Flowable):
    """Thin purple divider line"""
    def __init__(self, width):
        super().__init__()
        self.width = width

    def draw(self):
        self.canv.setStrokeColor(LIGHT_PURPLE)
        self.canv.setLineWidth(0.5)
        self.canv.line(0, 0, self.width, 0)


def clean_markdown(text):
    """Convert markdown formatting to reportlab XML tags"""
    # Bold + italic
    text = re.sub(r'\*\*\*(.*?)\*\*\*', r'<b><i>\1</i></b>', text)
    # Bold
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Italic
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Inline code
    text = re.sub(r'`(.*?)`', r'<font face="Courier" size="9">\1</font>', text)
    # Links - show text only for print
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'\1', text)
    # Clean emoji for compatibility
    text = text.replace('📞', '')
    text = text.replace('❌', '  ')
    text = text.replace('✅', '  ')
    # Escape XML special chars (but not our tags)
    text = text.replace('&', '&amp;')
    text = text.replace('<b>', '\x01b\x02').replace('</b>', '\x01/b\x02')
    text = text.replace('<i>', '\x01i\x02').replace('</i>', '\x01/i\x02')
    text = text.replace('<font', '\x01font').replace('</font>', '\x01/font\x02')
    text = text.replace('<', '&lt;').replace('>', '&gt;')
    text = text.replace('\x01', '<').replace('\x02', '>')
    return text


def add_header_footer(canvas_obj, doc):
    """Add header with logo and footer with page number"""
    canvas_obj.saveState()

    # Header line
    canvas_obj.setStrokeColor(LIGHT_PURPLE)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(MARGIN, HEIGHT - MARGIN + 8*mm, WIDTH - MARGIN, HEIGHT - MARGIN + 8*mm)

    # Header logo
    logo_path = '/tmp/logo_cropped.png'
    canvas_obj.drawImage(logo_path, MARGIN, HEIGHT - MARGIN + 8*mm, width=38*mm, height=8*mm, preserveAspectRatio=True, mask='auto')
    canvas_obj.setFont(HEADING_FONT, 7)
    canvas_obj.setFillColor(DEEP_PURPLE)
    canvas_obj.drawRightString(WIDTH - MARGIN, HEIGHT - MARGIN + 10*mm, 'PRANK CALL — Format Improwizowany')

    # Footer
    canvas_obj.setStrokeColor(LIGHT_PURPLE)
    canvas_obj.line(MARGIN, MARGIN - 5*mm, WIDTH - MARGIN, MARGIN - 5*mm)
    canvas_obj.setFont(BODY_FONT if BODY_FONT != 'Helvetica' else 'Helvetica', 7)
    canvas_obj.setFillColor(GRAY)
    canvas_obj.drawString(MARGIN, MARGIN - 10*mm, 'Improwizowane Radio  niebawem.fun')
    canvas_obj.drawRightString(WIDTH - MARGIN, MARGIN - 10*mm, f'{doc.page}')

    canvas_obj.restoreState()


def add_first_page(canvas_obj, doc):
    """First page with logo and accent"""
    canvas_obj.saveState()

    # Top accent bar
    canvas_obj.setFillColor(MAGENTA)
    canvas_obj.rect(0, HEIGHT - 4*mm, WIDTH, 4*mm, fill=1, stroke=0)

    # Logo on first page top-left
    logo_path = '/tmp/logo_cropped.png'
    canvas_obj.drawImage(logo_path, MARGIN, HEIGHT - MARGIN - 12*mm, width=91*mm, height=18*mm, preserveAspectRatio=True, mask='auto')

    # Footer only on first page
    canvas_obj.setStrokeColor(LIGHT_PURPLE)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(MARGIN, MARGIN - 5*mm, WIDTH - MARGIN, MARGIN - 5*mm)
    canvas_obj.setFont(BODY_FONT if BODY_FONT != 'Helvetica' else 'Helvetica', 7)
    canvas_obj.setFillColor(GRAY)
    canvas_obj.drawString(MARGIN, MARGIN - 10*mm, 'Improwizowane Radio  niebawem.fun')
    canvas_obj.drawRightString(WIDTH - MARGIN, MARGIN - 10*mm, f'{doc.page}')

    canvas_obj.restoreState()


def parse_markdown_to_story(filepath):
    """Parse markdown file and return reportlab story"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    story = []
    content_width = WIDTH - 2 * MARGIN
    i = 0

    # Title page elements
    story.append(Spacer(1, 15*mm))
    story.append(AccentBar(60*mm, 3))
    story.append(Spacer(1, 6*mm))

    while i < len(lines):
        line = lines[i].rstrip()

        # Skip empty lines
        if not line:
            i += 1
            continue

        # Horizontal rule
        if line.strip() == '---':
            story.append(Spacer(1, 4*mm))
            story.append(SectionDivider(content_width))
            story.append(Spacer(1, 4*mm))
            i += 1
            continue

        # H1 - Main title
        if line.startswith('# '):
            text = clean_markdown(line[2:].strip())
            story.append(Paragraph(text, title_style))
            i += 1
            continue

        # H3 under H1 (subtitle)
        if line.startswith('### ') and len(story) < 6:
            text = clean_markdown(line[4:].strip())
            story.append(Paragraph(text, subtitle_style))
            i += 1
            continue

        # H2
        if line.startswith('## '):
            text = clean_markdown(line[3:].strip())
            story.append(Spacer(1, 3*mm))
            story.append(Paragraph(text, h2_style))
            story.append(AccentBar(30*mm, 1.5))
            story.append(Spacer(1, 3*mm))
            i += 1
            continue

        # H3
        if line.startswith('### '):
            text = clean_markdown(line[4:].strip())
            story.append(Paragraph(text, h3_style))
            i += 1
            continue

        # Table
        if line.startswith('|') and i + 1 < len(lines) and lines[i + 1].strip().startswith('|---'):
            # Parse table
            headers = [clean_markdown(c.strip()) for c in line.split('|')[1:-1]]
            i += 2  # Skip header and separator
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [clean_markdown(c.strip()) for c in lines[i].split('|')[1:-1]]
                rows.append(cells)
                i += 1

            # Build table
            header_paras = [Paragraph(h, table_header_style) for h in headers]
            table_data = [header_paras]
            for row in rows:
                table_data.append([Paragraph(c, table_cell_style) for c in row])

            col_widths = [content_width * 0.2, content_width * 0.8] if len(headers) == 2 else None

            t = Table(table_data, colWidths=col_widths, repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), DEEP_PURPLE),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
                ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_PURPLE),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
                ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
                ('RIGHTPADDING', (0, 0), (-1, -1), 3*mm),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ]))
            story.append(t)
            story.append(Spacer(1, 4*mm))
            continue

        # Blockquote
        if line.startswith('> '):
            text = clean_markdown(line[2:].strip())
            story.append(Paragraph(text, quote_style))
            i += 1
            continue

        # Numbered list
        m = re.match(r'^(\d+)\.\s+(.*)', line)
        if m:
            num = m.group(1)
            text = clean_markdown(m.group(2))
            story.append(Paragraph(f'<b>{num}.</b>  {text}', numbered_style))
            i += 1
            continue

        # Bullet list
        if line.startswith('- '):
            text = clean_markdown(line[2:].strip())
            # Check if it contains a URL
            if 'http' in line:
                story.append(Paragraph(f'<font color="{MAGENTA.hexval()}">&#8226;</font>  {text}', link_style))
            else:
                story.append(Paragraph(f'<font color="{MAGENTA.hexval()}">&#8226;</font>  {text}', bullet_style))
            i += 1
            continue

        # Bold paragraph start
        if line.startswith('**') and ':**' in line:
            text = clean_markdown(line.strip())
            story.append(Paragraph(text, bold_body_style))
            i += 1
            continue

        # Regular paragraph
        text = clean_markdown(line.strip())
        if text.strip():
            story.append(Paragraph(text, body_style))
        i += 1

    # Final page - footer
    story.append(Spacer(1, 10*mm))
    story.append(SectionDivider(content_width))
    story.append(Spacer(1, 5*mm))

    footer_style = ParagraphStyle(
        'Footer',
        fontName=BODY_FONT,
        fontSize=8,
        leading=12,
        textColor=DEEP_PURPLE,
        alignment=TA_CENTER,
    )
    story.append(Paragraph('niebawem.fun', footer_style))

    return story


def main():
    import sys

    if len(sys.argv) < 2:
        print('Usage: python3 generate_branded_pdf.py input.md [output.pdf]')
        print('  input.md   — markdown file to convert')
        print('  output.pdf — output path (default: same name as input with .pdf)')
        sys.exit(1)

    md_path = sys.argv[1]
    if len(sys.argv) >= 3:
        pdf_path = sys.argv[2]
    else:
        pdf_path = os.path.splitext(md_path)[0] + '.pdf'

    # Prepare logo: crop whitespace from qlmanage output
    logo_svg = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'logo.svg')
    if not os.path.exists('/tmp/logo_cropped.png') or os.path.getmtime(logo_svg) > os.path.getmtime('/tmp/logo_cropped.png'):
        os.system(f'qlmanage -t -s 2400 -o /tmp/ "{logo_svg}" 2>/dev/null')
        try:
            from PIL import Image
            import numpy as np
            img = Image.open('/tmp/logo.svg.png').convert('RGBA')
            arr = np.array(img)
            non_white = np.where(arr[:,:,:3].mean(axis=2) < 250)
            if len(non_white[0]) > 0:
                top, bottom = non_white[0].min(), non_white[0].max()
                left, right = non_white[1].min(), non_white[1].max()
                img.crop((left-5, top-5, right+5, bottom+5)).save('/tmp/logo_cropped.png')
        except ImportError:
            print('Warning: PIL not available, logo may have whitespace padding')
            os.rename('/tmp/logo.svg.png', '/tmp/logo_cropped.png')

    # Extract title from first H1 in markdown
    title = 'niebawem.fun'
    with open(md_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('# '):
                title = line[2:].strip().replace('📞 ', '')
                break

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN + 5*mm,
        bottomMargin=MARGIN,
        title=title,
        author='niebawem.fun',
    )

    story = parse_markdown_to_story(md_path)
    doc.build(story, onFirstPage=add_first_page, onLaterPages=add_header_footer)
    print(f'PDF saved to: {pdf_path}')


if __name__ == '__main__':
    main()
