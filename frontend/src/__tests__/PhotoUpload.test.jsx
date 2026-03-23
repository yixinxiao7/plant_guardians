import { render, screen } from '@testing-library/react';
import PhotoUpload from '../components/PhotoUpload.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Image: (props) => <span data-testid="icon-image" {...props} />,
  Camera: (props) => <span data-testid="icon-camera" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

vi.mock('../utils/validation.js', () => ({
  validatePhotoFile: () => null,
}));

describe('PhotoUpload', () => {
  it('renders without crashing', () => {
    render(<PhotoUpload onChange={() => {}} />);
    expect(screen.getByLabelText('Upload plant photo')).toBeInTheDocument();
  });

  it('renders upload zone', () => {
    render(<PhotoUpload onChange={() => {}} />);
    expect(screen.getByText('Upload a photo')).toBeInTheDocument();
    expect(screen.getByText('JPG, PNG up to 5MB')).toBeInTheDocument();
  });

  it('shows preview when previewUrl provided', () => {
    render(
      <PhotoUpload
        previewUrl="http://example.com/photo.jpg"
        onChange={() => {}}
      />
    );
    expect(screen.getByAltText('Plant preview')).toBeInTheDocument();
  });
});
